import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// 🎨 Spaltenfarben (orange = Eingaben, türkis = Status)
const COLUMN_COLORS = {
  Object_Name: "#FFCC00",
  Description: "#FFCC00",
  Date_List: "#FFCC00",
};

export default function CAL() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    ObjSort_LfdNr: "",
    UUID: "",
    Objekt_Template_Kennung: "",
    Kommentar: "",
    GA_FL_1_3_2: "",
    GA_FL_3_1_1: "",
    GA_FL_3_1_3: "",
    GA_FL_Abschnitte_Spalten: "",
    Object_Name: "",
    Description: "",
    Verwendung: "",
    Date_List: "",
    Version: "",
  });

  const generateUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  const loadData = async () => {
    try {
      const res = await axios.get(`${API_URL}/cal`);
      setItems(res.data || []);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const keys = useMemo(() => Object.keys(form).filter((k) => k !== "UUID"), [form]);

  const filteredItems = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      keys.some((k) => String(row?.[k] ?? "").toLowerCase().includes(q))
    );
  }, [items, filter, keys]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, UUID: form.UUID || generateUUID() };
    try {
      await axios.post(`${API_URL}/cal`, payload);
      setForm(Object.fromEntries(Object.keys(form).map((k) => [k, ""])));
      loadData();
    } catch (err) {
      alert("Fehler: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📅 CAL Templates</h2>

      {/* 🔍 Suchfeld */}
      <div style={{ marginBottom: 15 }}>
        <input
          type="text"
          placeholder="🔍 Suchen (in allen Spalten)…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* 📋 Tabelle */}
      <div
        style={{
          overflow: "auto",
          maxHeight: "60vh",
          border: "1px solid #ccc",
          padding: 4,
          marginBottom: 24,
        }}
      >
        <table
          border="1"
          cellPadding="6"
          style={{
            borderCollapse: "collapse",
            fontSize: "0.8rem",
            whiteSpace: "nowrap",
            minWidth: 900,
          }}
        >
          <thead>
            <tr>
              {keys.map((key) => (
                <th
                  key={key}
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    textAlign: "center",
                    verticalAlign: "middle",
                    padding: "4px 2px",
                    background: COLUMN_COLORS[key] || "#f3f3f3",
                    borderBottom: "2px solid #999",
                    fontSize: "0.7rem",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    height: "120px",
                  }}
                >
                  {key.replaceAll("_", " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => (
                <tr
                  key={item.id ?? idx}
                  style={{ background: idx % 2 ? "#fafafa" : "transparent" }}
                >
                  {keys.map((key) => (
                    <td
                      key={key}
                      style={{
                        border: "1px solid #ddd",
                        padding: "4px 6px",
                        textAlign: "left",
                        backgroundColor: COLUMN_COLORS[key] || "transparent",
                      }}
                    >
                      {item?.[key] ?? ""}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={keys.length}
                  style={{ textAlign: "center", color: "#888", padding: 10 }}
                >
                  Keine Einträge vorhanden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ➕ Formular unten */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
          paddingTop: 10,
          borderTop: "2px solid #eee",
        }}
      >
        <input type="hidden" name="UUID" value={form.UUID} onChange={handleChange} />
        {keys.map((key) => (
          <input
            key={key}
            name={key}
            placeholder={key.replaceAll("_", " ")}
            value={form[key]}
            onChange={handleChange}
            style={{
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: "6px 8px",
              background: COLUMN_COLORS[key] || "#fff",
            }}
          />
        ))}
        <button type="submit" style={{ gridColumn: "span 2" }}>
          ➕ Hinzufügen
        </button>
      </form>
    </div>
  );
}
