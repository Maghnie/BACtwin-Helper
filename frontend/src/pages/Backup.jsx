export default function ProjectBackupButton() {
  const handleBackup = async () => {
    try {
      const response = await axios.get(`${API_URL}/backup`, {
        responseType: "blob", // wichtig für Datei-Download
      });

      // Blob → Download auslösen
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Dateiname aus dem Header oder Fallback
      const cd = response.headers["content-disposition"];
      const match = cd?.match(/filename="?(.+)"?/);
      const filename = match ? match[1] : "backup.zip";

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Backup-Fehler:", error);
      alert("Backup konnte nicht erstellt werden");
    }
  };

  return (
    <button
      onClick={handleBackup}
      style={{
        padding: "10px 20px",
        borderRadius: "8px",
        backgroundColor: "#33CCCC",
        border: "none",
        color: "white",
        cursor: "pointer",
      }}
    >
      💾 Backup herunterladen
    </button>
  );
}