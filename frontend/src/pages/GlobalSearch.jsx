import { useState } from "react";
import axios from "axios";
import { X } from "lucide-react"; // Icon importieren
import { API_URL } from '../config';

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async (value) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/search?q=${encodeURIComponent(value)}`);
      setResults(res.data);
    } catch (err) {
      console.error("Fehler bei der Suche:", err);
      setResults([]);
    }
  };

  const clearInput = () => {
    setQuery("");
    setResults([]);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ position: "relative", width: "100%" }}>
        <input
          type="text"
          placeholder="🔍 Globale Suche (z. B. EL, Heizung, BM …)"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 10px 8px 36px", // Platz rechts für Icon
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "1em",
            outline: "none",
            transition: "border-color 0.2s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
          onBlur={(e) => (e.target.style.borderColor = "#ccc")}
        />

        {query && (
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

      {results.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            marginTop: 6,
            maxHeight: "300px",
            overflowY: "auto",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          {results.map((r) => (
            <div
              key={`${r.tabelle}-${r.id}`}
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <strong>{r.kuerzel}</strong> – {r.bezeichnung}
              <div style={{ fontSize: "0.8em", color: "#666" }}>
                ({r.tabelle})
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
