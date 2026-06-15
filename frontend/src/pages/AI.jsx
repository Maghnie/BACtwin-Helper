import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from '../config';


// Spaltenfarben definieren (UNVERÄNDERT lassen)
const COLUMN_COLORS = {
  Object_Name: "#FFCC00", // orange
  Description: "#FFCC00",
  Units: "#FFCC00",
  COV_Increment: "#FFCC00",
  Time_Delay: "#FFCC00",
  Notification_Class: "#FFCC00",
  Low_Limit: "#FFCC00",
  High_Limit: "#FFCC00",
  Deadband: "#FFCC00",
  Limit_Enable: "#FFCC00",
  Event_Enable: "#FFCC00",
  Notify_Type: "#FFCC00",
  Event_Message_Texts_Config: "#FFCC00",
  Event_Detection_Enable: "#FFCC00",
  Time_Delay_Normal: "#FFCC00",
  Status_Flags: "#33CCCC", // türkis
  Event_State: "#33CCCC",
  Reliability: "#33CCCC",
  Out_Of_Service: "#33CCCC",
  Event_Time_Stamps: "#33CCCC",
  Event_Message_Texts: "#33CCCC",
};

export default function AI() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    ObjSort_LfdNr: "",
    UUID: "",
    Objekt_Template_Kennung: "",
    Kommentar: "",
    GA_FL_1_1_1: "",
    GA_FL_2_2_1: "",
    GA_FL_3_1_1: "",
    GA_FL_3_1_3: "",
    GA_FL_Abschnitte_Spalten: "",
    Object_Name: "",
    Description: "",
    Verwendung: "",
    Status_Flags: "",
    Event_State: "",
    Reliability: "",
    Out_Of_Service: "",
    Units: "",
    Min_Pres_Value: "",
    Max_Pres_Value: "",
    Resolution: "",
    COV_Increment: "",
    Time_Delay: "",
    Notification_Class: "",
    Low_Limit: "",
    High_Limit: "",
    Deadband: "",
    Limit_Enable: "",
    Event_Enable: "",
    Notify_Type: "",
    Event_Time_Stamps: "",
    Event_Message_Texts: "",
    Event_Message_Texts_Config: "",
    Event_Detection_Enable: "",
    Event_Algorithm_Inhibit: "",
    Event_Algorithm_Inhibit_Ref: "",
    Time_Delay_Normal: "",
    Reliability_Evaluation_Inhibit: "",
    Version: "",
  });

  // UUID Generator
  const generateUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  const loadData = async () => {
    try {
      const res = await axios.get(`${API_URL}/ai`);
      setItems(res.data || []);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const keysForTable = useMemo(
    () => Object.keys(form).filter((k) => k !== "UUID"),
    [form]
  );

  // 🔍 Filterlogik (alle sichtbaren Felder)
  const filteredItems = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      keysForTable.some((k) => String(row?.[k] ?? "").toLowerCase().includes(q))
    );
  }, [items, filter, keysForTable]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, UUID: form.UUID || generateUUID() };
    try {
      await axios.post(`${API_URL}/ai`, payload);
      // Formular zurücksetzen
      setForm(Object.fromEntries(Object.keys(form).map((k) => [k, ""])));
      // Neu laden
      loadData();
    } catch (err) {
      alert("Fehler: " + (err?.message || String(err)));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🌡️ AI Templates</h2>

      {/* 🔍 Suchleiste oben */}
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

      {/* 📋 Tabelle mittig */}
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
              {keysForTable.map((key) => (
                <th
                  key={key}
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    textAlign: "left",
                    verticalAlign: "middle",
                    padding: "4px 2px",
                    background: COLUMN_COLORS[key] || "#f3f3f3",
                    borderBottom: "2px solid #999",
                    fontSize: "0.7rem",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
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
                <tr key={item.id ?? idx} style={{ background: idx % 2 ? "#fafafa" : "transparent" }}>
                  {keysForTable.map((key) => (
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
                  colSpan={keysForTable.length}
                  style={{ textAlign: "center", color: "#888", padding: 10 }}
                >
                  Keine Einträge gefunden
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
        {keysForTable.map((key) => (
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
        <button type="submit" style={{ gridColumn: "span 2" }}>➕ Hinzufügen</button>
      </form>
    </div>
  );
}
