import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// 🎨 Spaltenfarben: orange = Parameter, türkis = Status
const COLUMN_COLORS = {
  Object_Name: "#FFCC00",
  Description: "#FFCC00",
  Output_Units: "#FFCC00",
  Manipulated_Variable_Reference: "#FFCC00",
  Controlled_Variable_Reference: "#FFCC00",
  Controlled_Variable_Units: "#FFCC00",
  Setpoint_Reference: "#FFCC00",
  Action: "#FFCC00",
  Proportional_Constant: "#FFCC00",
  Proportional_Constant_Units: "#FFCC00",
  Integral_Constant: "#FFCC00",
  Integral_Constant_Units: "#FFCC00",
  Derivative_Constant: "#FFCC00",
  Derivative_Constant_Units: "#FFCC00",
  Maximum_Output: "#FFCC00",
  Minimum_Output: "#FFCC00",
  Priority_For_Writing: "#FFCC00",
  COV_Increment: "#FFCC00",
  Time_Delay: "#FFCC00",
  Notification_Class: "#FFCC00",
  Event_Enable: "#FFCC00",
  Time_Delay_Normal: "#FFCC00",
  Error_Limit: "#FFCC00",
  Deadband: "#FFCC00",
  Low_Diff_Limit: "#FFCC00",
  Notify_Type: "#FFCC00",
  Event_Message_Texts_Config: "#FFCC00",
  Event_Detection_Enable: "#FFCC00",
  Event_Algorithm_Inhibit_Ref: "#FFCC00",

  Status_Flags: "#33CCCC",
  Event_State: "#33CCCC",
  Reliability: "#33CCCC",
  Out_Of_Service: "#33CCCC",
  Event_Time_Stamps: "#33CCCC",
  Event_Message_Texts: "#33CCCC",
};

export default function LP() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    ObjSort_LfdNr: "",
    UUID: "",
    Objekt_Template_Kennung: "",
    Kommentar: "",
    GA_FL_1_3_5: "",
    GA_FL_3_1_1: "",
    GA_FL_Bemerkung: "",
    GA_FL_Abschnitte_Spalten: "",
    Object_Name: "",
    Description: "",
    Verwendung: "",
    Status_Flags: "",
    Event_State: "",
    Reliability: "",
    Out_Of_Service: "",
    Output_Units: "",
    Manipulated_Variable_Reference: "",
    Controlled_Variable_Reference: "",
    Controlled_Variable_Units: "",
    Setpoint_Reference: "",
    Action: "",
    Proportional_Constant: "",
    Proportional_Constant_Units: "",
    Integral_Constant: "",
    Integral_Constant_Units: "",
    Derivative_Constant: "",
    Derivative_Constant_Units: "",
    Maximum_Output: "",
    Minimum_Output: "",
    Priority_For_Writing: "",
    COV_Increment: "",
    Time_Delay: "",
    Notification_Class: "",
    Event_Enable: "",
    Time_Delay_Normal: "",
    Error_Limit: "",
    Deadband: "",
    Low_Diff_Limit: "",
    Notify_Type: "",
    Event_Time_Stamps: "",
    Event_Message_Texts: "",
    Event_Message_Texts_Config: "",
    Event_Detection_Enable: "",
    Event_Algorithm_Inhibit_Ref: "",
    Reliability_Evaluation_Inhibit: "",
    Version: "",
  });

  // 🧠 UUID Generator
  const generateUUID = () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  // 🔹 Daten laden
  const loadData = async () => {
    try {
      const res = await axios.get(`${API_URL}/lp`);
      setItems(res.data || []);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 🔍 Filterlogik
  const keys = useMemo(() => Object.keys(form).filter((k) => k !== "UUID"), [form]);
  const filteredItems = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) =>
      keys.some((k) => String(row?.[k] ?? "").toLowerCase().includes(q))
    );
  }, [items, filter, keys]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 💾 Speichern
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, UUID: form.UUID || generateUUID() };
    try {
      await axios.post(`${API_URL}/lp`, payload);
      setForm(Object.fromEntries(Object.keys(form).map((k) => [k, ""])));
      loadData();
    } catch (err) {
      alert("Fehler: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🔁 LP Templates</h2>

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
            minWidth: 1100,
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
                <tr key={item.id ?? idx} style={{ background: idx % 2 ? "#fafafa" : "transparent" }}>
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
                <td colSpan={keys.length} style={{ textAlign: "center", color: "#888", padding: 10 }}>
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
