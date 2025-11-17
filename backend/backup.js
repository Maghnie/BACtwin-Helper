// server/backup.js
import express from "express";
import archiver from "archiver";
import path from "path";
import fs from "fs";

const router = express.Router();

// Basisverzeichnis (Frontend + Backend)
const ROOT_DIR = path.resolve(process.cwd(), ".."); // z. B. dein Projekt-Root

router.get("/zip", async (req, res) => {
  try {
    console.log("Zip Erstellung starten");
    const zipName = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
    const zipPath = path.join(ROOT_DIR, zipName);

    // Antwort-Header (damit Browser es direkt als Download erkennt)
    res.setHeader("Content-Disposition", `attachment; filename=${zipName}`);
    res.setHeader("Content-Type", "application/zip");

    // ZIP-Stream
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    // 🔒 optional: bestimmte Ordner ausschließen (node_modules etc.)
    archive.glob("**/*", {
      cwd: ROOT_DIR,
      ignore: [
        "**/node_modules/**",
        "**/dist/**",
        "**/.git/**",
        "**/.env*",
        "backup_*.zip",
      ],
    });
    console.log("Zip Erstellung läuft");
    await archive.finalize();
    console.log("Zip Erstellung beendet");
  } catch (err) {
    console.error("Backup-Fehler:", err);
    res.status(500).send("Fehler beim Erstellen des Backups");
  }
});

export default router;
