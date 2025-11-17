import { useState } from "react";
import axios from "axios";
import { X } from "lucide-react"; // modern, leichtes Icon

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function LookupSearch() {
  const [kuerzel, setKuerzel] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (value) => {
    setKuerzel(value);
    setError(null);
    setResult(null);

    if (value.trim().length < 2) return;

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/lookup?k=${encodeURIComponent(value)}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Keine Ergebnisse gefunden");
    } finally {
      setLoading(false);
    }
  };

  const clearInput = () => {
    setKuerzel("");
    setResult(null);
    setError(null);
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ position: "relative", width: "100%" }}>
        <input
          type="text"
          placeholder="🎯 Exaktes Kürzel eingeben (z. B. EL~, HZG, T~~ …)"
          value={kuerzel}
          onChange={(e) => handleLookup(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 10px 8px 36px",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "1em",
            outline: "none",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#ccc")}
        />

        {/* ❌ Icon-Button */}
        {kuerzel && (
          <button
            onClick={clearInput}
            title="Eingabe löschen"
            style={{
              position: "absolute",
              left: 6,
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 4,
              borderRadius: "50%",
              color: "#777",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#eee";
              e.currentTarget.style.color = "#333";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#777";
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {loading && <p style={{ marginTop: 8 }}>⏳ Suche…</p>}

      {result && (
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #ddd",
            borderRadius: 8,
            marginTop: 10,
            padding: "10px 12px",
          }}
        >
          <strong>{result.kuerzel}</strong> – {result.bezeichnung}
          <div style={{ fontSize: "0.9em", color: "#555" }}>{result.beschreibung}</div>
          <div style={{ fontSize: "0.8em", color: "#888" }}>📂 {result.tabelle}</div>
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: 8 }}>❌ {error}</p>}
    </div>
  );
}
