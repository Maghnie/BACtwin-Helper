import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function Gewerke() {
  const [gewerke, setGewerke] = useState([]);
  const [form, setForm] = useState({
    kg: "",
    kuerzel: "",
    bezeichnung: "",
    beschreibung: "",
  });
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchGewerke();
  }, []);

  const fetchGewerke = async () => {
    const res = await axios.get(`${API_URL}/gewerke`);
    setGewerke(res.data);
  };

  const addGewerk = async () => {
    if (!form.kg || !form.kuerzel || !form.bezeichnung) return;
    const res = await axios.post(`${API_URL}/gewerke`, form);
    setGewerke([...gewerke, res.data]);
    setForm({ kg: "", kuerzel: "", bezeichnung: "", beschreibung: "" });
  };

  const updateGewerk = (id, field, value) => {
    setGewerke(
      gewerke.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const saveGewerk = async (id) => {
    const g = gewerke.find((x) => x.id === id);
    await axios.put(`${API_URL}/gewerke/${id}`, g);
  };

  // 🔍 Filterlogik
  const filteredGewerke = gewerke.filter((g) => {
    const q = filter.toLowerCase();
    return (
      g.kg.toString().includes(q) ||
      g.kuerzel.toLowerCase().includes(q) ||
      g.bezeichnung.toLowerCase().includes(q) ||
      (g.beschreibung || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1>🏗️ Gewerke</h1>

      {/* 🔍 Filterfeld */}
      <div style={{ marginBottom: 15 }}>
        <input
          type="text"
          placeholder="🔍 Filter (KG, Kürzel, Bezeichnung, Beschreibung)..."
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

      {/* 📋 Tabelle */}
      <div style={{ overflowX: "auto", marginBottom: 25 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 600,
          }}
        >
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ width: "80px" }}>KG</th>
              <th style={{ width: "100px" }}>Kürzel</th>
              <th style={{ width: "200px" }}>Bezeichnung</th>
              <th>Beschreibung</th>
              {/*<th style={{ width: "60px" }}>💾</th>*/}
            </tr>
          </thead>
          <tbody>
            {filteredGewerke.map((g) => (
              <tr key={g.id}>
                <td>
                  <input
                    value={g.kg}
                    onChange={(e) => updateGewerk(g.id, "kg", e.target.value)}
                    style={cellStyle}
                  />
                </td>
                <td>
                  <input
                    value={g.kuerzel}
                    onChange={(e) =>
                      updateGewerk(g.id, "kuerzel", e.target.value)
                    }
                    style={cellStyle}
                  />
                </td>
                <td>
                  <input
                    value={g.bezeichnung}
                    onChange={(e) =>
                      updateGewerk(g.id, "bezeichnung", e.target.value)
                    }
                    style={cellStyle}
                  />
                </td>
                <td>
                  <input
                    value={g.beschreibung || ""}
                    onChange={(e) =>
                      updateGewerk(g.id, "beschreibung", e.target.value)
                    }
                    style={cellStyle}
                  />
                </td>
                {/*<td style={{ textAlign: "center" }}>
                  <button
                    onClick={() => saveGewerk(g.id)}
                    title="Speichern"
                    style={saveBtnStyle}
                  >
                    💾
                  </button>
                </td>*/}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredGewerke.length === 0 && (
        <p style={{ marginTop: 10, color: "#666" }}>Keine Gewerke gefunden.</p>
      )}

      {/*  Formular */}
      {/*
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 30,
          paddingTop: 10,
          borderTop: "2px solid #eee",
        }}
      >
        <input
          placeholder="KG"
          value={form.kg}
          onChange={(e) => setForm({ ...form, kg: e.target.value })}
          style={{ flex: "0 1 80px" }}
        />
        <input
          placeholder="Kürzel"
          value={form.kuerzel}
          onChange={(e) => setForm({ ...form, kuerzel: e.target.value })}
          style={{ flex: "0 1 100px" }}
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
        <button onClick={addGewerk}>➕</button>
      </div>*/}
    </div>
  );
}

const cellStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #ddd",
  borderRadius: 4,
  padding: "4px",
};

const saveBtnStyle = {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "1.2em",
};

export default Gewerke;
