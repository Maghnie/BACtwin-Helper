import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../config';

function Baugruppe() {
  const [gruppen, setGruppen] = useState([]);
  const [form, setForm] = useState({ kuerzel: "", bezeichnung: "", beschreibung: "" });
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchGruppen();
  }, []);

  const fetchGruppen = async () => {
    const res = await axios.get(`${API_URL}/baugruppe`);
    setGruppen(res.data);
  };

  const addGruppe = async () => {
    if (!form.kuerzel || !form.bezeichnung) return;
    const res = await axios.post(`${API_URL}/baugruppe`, form);
    setGruppen([...gruppen, res.data]);
    setForm({ kuerzel: "", bezeichnung: "", beschreibung: "" });
  };

  const updateGruppe = (id, field, value) => {
    setGruppen(gruppen.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const saveGruppe = async (id) => {
    const g = gruppen.find((x) => x.id === id);
    await axios.put(`${API_URL}/baugruppe/${id}`, g);
  };

  const filtered = gruppen.filter((g) => {
    const q = filter.toLowerCase();
    return (
      g.kuerzel.toLowerCase().includes(q) ||
      g.bezeichnung.toLowerCase().includes(q) ||
      (g.beschreibung || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1>🧩 Baugruppen</h1>

      {/* Formular */}
      {/*
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        <input
          placeholder="Kürzel"
          value={form.kuerzel}
          onChange={(e) => setForm({ ...form, kuerzel: e.target.value })}
          style={{ flex: "0 1 80px" }}
        />
        <input
          placeholder="Bezeichnung"
          value={form.bezeichnung}
          onChange={(e) => setForm({ ...form, bezeichnung: e.target.value })}
          style={{ flex: "1 1 200px" }}
        />
        <input
          placeholder="Beschreibung"
          value={form.beschreibung}
          onChange={(e) => setForm({ ...form, beschreibung: e.target.value })}
          style={{ flex: "2 1 300px" }}
        />
        <button onClick={addGruppe}>➕</button>
      </div>
      */}

      {/* Filter */}
      <div style={{ marginBottom: 15 }}>
        <input
          type="text"
          placeholder="🔍 Filter (Kürzel, Bezeichnung, Beschreibung)..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* Tabelle */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ width: "80px" }}>Kürzel</th>
              <th>Bezeichnung</th>
              <th>Beschreibung</th>
              {/*<th style={{ width: "50px" }}>💾</th>*/}
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id}>
                <td>
                  <input
                    value={g.kuerzel}
                    onChange={(e) => updateGruppe(g.id, "kuerzel", e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      padding: "4px",
                    }}
                  />
                </td>
                <td>
                  <input
                    value={g.bezeichnung}
                    onChange={(e) => updateGruppe(g.id, "bezeichnung", e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      padding: "4px",
                    }}
                  />
                </td>
                <td>
                  <input
                    value={g.beschreibung || ""}
                    onChange={(e) => updateGruppe(g.id, "beschreibung", e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      padding: "4px",
                    }}
                  />
                </td>
                {/*<td style={{ textAlign: "center" }}>
                  <button
                    onClick={() => saveGruppe(g.id)}
                    title="Speichern"
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "1.2em",
                    }}
                  >
                    💾
                  </button>
                </td>*/}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p style={{ marginTop: 10, color: "#666" }}>Keine Baugruppen gefunden.</p>
      )}
    </div>
  );
}

export default Baugruppe;
