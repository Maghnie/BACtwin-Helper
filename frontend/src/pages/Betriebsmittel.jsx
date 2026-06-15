import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../config';

function Betriebsmittel() {
  const [daten, setDaten] = useState([]);
  const [form, setForm] = useState({ kuerzel: "", bezeichnung: "", beschreibung: "" });
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchDaten();
  }, []);

  const fetchDaten = async () => {
    const res = await axios.get(`${API_URL}/betriebsmittel`);
    setDaten(res.data);
  };

  const addDatensatz = async () => {
    if (!form.kuerzel || !form.bezeichnung) return;
    const res = await axios.post(`${API_URL}/betriebsmittel`, form);
    setDaten([...daten, res.data]);
    setForm({ kuerzel: "", bezeichnung: "", beschreibung: "" });
  };

  const updateDatensatz = (id, field, value) => {
    setDaten(daten.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const saveDatensatz = async (id) => {
    const d = daten.find((x) => x.id === id);
    await axios.put(`${API_URL}/betriebsmittel/${id}`, d);
  };

  const filtered = daten.filter((d) => {
    const q = filter.toLowerCase();
    return (
      d.kuerzel.toLowerCase().includes(q) ||
      d.bezeichnung.toLowerCase().includes(q) ||
      (d.beschreibung || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1>🔧 Betriebsmittel</h1>

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
        <button onClick={addDatensatz}>➕</button>
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
            {filtered.map((d) => (
              <tr key={d.id}>
                <td>
                  <input
                    value={d.kuerzel}
                    onChange={(e) => updateDatensatz(d.id, "kuerzel", e.target.value)}
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
                    value={d.bezeichnung}
                    onChange={(e) => updateDatensatz(d.id, "bezeichnung", e.target.value)}
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
                    value={d.beschreibung || ""}
                    onChange={(e) => updateDatensatz(d.id, "beschreibung", e.target.value)}
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
                    onClick={() => saveDatensatz(d.id)}
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
        <p style={{ marginTop: 10, color: "#666" }}>Keine Betriebsmittel gefunden.</p>
      )}
    </div>
  );
}

export default Betriebsmittel;
