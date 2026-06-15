import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../config';

function Anlage() {
  const [anlagen, setAnlagen] = useState([]);
  const [form, setForm] = useState({ kuerzel: "", bezeichnung: "", beschreibung: "" });
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchAnlagen();
  }, []);

  const fetchAnlagen = async () => {
    const res = await axios.get(`${API_URL}/anlage`);
    setAnlagen(res.data);
  };

  const addAnlage = async () => {
    if (!form.kuerzel || !form.bezeichnung) return;
    const res = await axios.post(`${API_URL}/anlage`, form);
    setAnlagen([...anlagen, res.data]);
    setForm({ kuerzel: "", bezeichnung: "", beschreibung: "" });
  };

  const updateAnlage = (id, field, value) => {
    setAnlagen(
      anlagen.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const saveAnlage = async (id) => {
    const a = anlagen.find((x) => x.id === id);
    await axios.put(`${API_URL}/anlage/${id}`, a);
  };

  const filtered = anlagen.filter((a) => {
    const q = filter.toLowerCase();
    return (
      a.kuerzel.toLowerCase().includes(q) ||
      a.bezeichnung.toLowerCase().includes(q) ||
      (a.beschreibung || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1>🛢️ Anlagen</h1>

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
        <button onClick={addAnlage}>➕</button>
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
              <th style={{ width: "100px" }}>Kürzel</th>
              <th style={{ width: "200px" }}>Bezeichnung</th>
              <th>Beschreibung</th>
              {/*<th style={{ width: "60px" }}>💾</th>*/}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>
                  <input
                    value={a.kuerzel}
                    onChange={(e) => updateAnlage(a.id, "kuerzel", e.target.value)}
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
                    value={a.bezeichnung}
                    onChange={(e) =>
                      updateAnlage(a.id, "bezeichnung", e.target.value)
                    }
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
                    value={a.beschreibung || ""}
                    onChange={(e) =>
                      updateAnlage(a.id, "beschreibung", e.target.value)
                    }
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
                    onClick={() => saveAnlage(a.id)}
                    title="Speichern"
                    style={{
                      border: "none",
                      boxSizing: "border-box",
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
        <p style={{ marginTop: 10, color: "#666" }}>Keine Anlagen gefunden.</p>
      )}
    </div>
  );
}

export default Anlage;
