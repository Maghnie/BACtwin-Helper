import axios from "axios";
import { API_URL } from '../config';

export default function BackupButton() {
  const handleBackup = async () => {
    if (!confirm("Soll wirklich eine Datensicherung erstellt werden?")) return;

    try {
      // Öffnet den Download direkt im Browser
      window.open(`${API_URL}/backup`, "_blank");
    } catch (err) {
      alert("❌ Fehler beim Backup: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <button
      onClick={handleBackup}
      style={{
        backgroundColor: "#1976d2",
        color: "white",
        padding: "8px 16px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        fontSize: "0.9rem",
      }}
    >
      💾 SQL Datensicherung starten
    </button>
  );
}


