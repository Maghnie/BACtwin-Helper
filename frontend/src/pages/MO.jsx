import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from '../config';

// 🎨 Spaltenfarben
const COLUMN_COLORS = {
  Object_Name: "#FFCC00",
  Description: "#FFCC00",
  Number_Of_States: "#FFCC00",
  State_Text: "#FFCC00",
  Relinquish_Default: "#FFCC00",
  Time_Delay: "#FFCC00",
  Notification_Class: "#FFCC00",
  Feedback_Value: "#FFCC00",
  Alarm_Values: "#FFCC00",
  Fault_Values: "#FFCC00",
  Event_Enable: "#FFCC00",
  Notify_Type: "#FFCC00",
  Event_Message_Texts_Config: "#FFCC00",
  Event_Detection_Enable: "#FFCC00",
  Time_Delay_Normal: "#FFCC00",

  Status_Flags: "#33CCCC",
  Event_State: "#33CCCC",
  Reliability: "#33CCCC",
  Out_Of_Service: "#33CCCC",
  Event_Time_Stamps: "#33CCCC",
  Event_Message_Texts: "#33CCCC",
  Current_Command_Priority: "#33CCCC",
};

export default function MO() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({
    ObjSort_LfdNr: "",
    UUID: "",
    Objekt_Template_Kennung: "",
    Kommentar: "",
    GA_FL_1_1_2: "",
    GA_FL_1_2_2: "",
    GA_FL_2_2_1: "",
    GA_FL_2_2_4: "",
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
    Number_Of_States: "",
    State_Text: "",
    Relinquish_Default: "",
    Time_Delay: "",
    Notification_Class: "",
    Feedback_Value: "",
    Alarm_Values: "",
    Fault_Values: "",
    Event_Enable: "",
    Notify_Type: "",
    Event_Time_Stamps: "",
    Event_Message_Texts: "",
    Event_Message_Texts_Config: "",
    Event_Detection_Enable: "",
    Event_Algorithm_Inhibit_Ref: "",
    Time_Delay_Normal: "",
    Reliability_Evaluation_Inhibit: "",
    Current_Command_Priority: "",
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
      const res = await axios.get(`${API_URL}/mo`);
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
      await axios.post(`${API_URL}/mo`, payload);
      setForm(Object.fromEntries(Object.keys(form).map((k) => [k, ""])));
      loadData();
    } catch (err) {
      alert("Fehler: " + err.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🎛️ MO Templates</h2>

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
