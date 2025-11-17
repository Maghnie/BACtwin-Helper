import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const router = express.Router();

// === Pfade/Namensraum anpassen ===
const DB_PATH = process.env.BACTWIN_DB_PATH || "data.db";  // <- ggf. "data.db"
const BASE_URI = process.env.BACTWIN_BASE_URI || "http://bactwin.org/ont#";

// DB öffnen
async function openDb() {
  return open({ filename: DB_PATH, driver: sqlite3.Database });
}

// Turtle-String escapen
function escapeTTL(value) {
  if (value === null || value === undefined) return '""';
  const s = String(value)
    .replace(/\\/g, "\\\\")   // Backslashes
    .replace(/"/g, '\\"')     // Quotes
    .replace(/\n/g, "\\n");   // Zeilenumbrüche
  return `"${s}"`;
}

// Tabelle prüfen
async function ensureTable(db, tableName) {
  const rows = await db.all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    [tableName]
  );
  return rows.length > 0;
}

// --------- Turtle ----------
router.get("/:objectType", async (req, res) => {
  const { objectType } = req.params;
  const tableName = objectType.toUpperCase();

  try {
    const db = await openDb();

    // Existenz prüfen
    const exists = await ensureTable(db, tableName);
    if (!exists) {
      return res.status(404).send(`Tabelle ${tableName} nicht gefunden`);
    }

    const rows = await db.all(`SELECT * FROM ${tableName}`);
    if (!rows.length) {
      return res.status(404).send(`Tabelle ${tableName} ist leer`);
    }

    // Header/Prefix
    let ttl = `
@prefix bactwin: <${BASE_URI}> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

bactwin:${tableName} a rdfs:Class ;
  rdfs:label "BACtwin ${tableName} Object" ;
  rdfs:comment "Automatically generated ontology from BACnet ${tableName} templates." .

`;

    // Individuals
    for (const row of rows) {
      const subjLocal = row.Objekt_Template_Kennung || `${tableName}_${row.id}`;
      const subj = `bactwin:${subjLocal}`;
      ttl += `${subj} a bactwin:${tableName} ;\n`;

      // Properties
      const entries = Object.entries(row).filter(([k]) => k !== "id");
      entries.forEach(([key, val], idx) => {
        const isLast = idx === entries.length - 1;
        ttl += `  bactwin:${key} ${escapeTTL(val)} ${isLast ? ".\n\n" : ";\n"}`;
      });

      if (entries.length === 0) {
        ttl += ".\n\n";
      }
    }

    res.type("text/turtle").send(ttl);
  } catch (err) {
    console.error("❌ Fehler in /ontology/:objectType:", err);
    res.status(500).send("Fehler beim Generieren der Turtle-Ontologie");
  }
});

// --------- JSON-LD ----------
router.get("/:objectType/jsonld", async (req, res) => {
  const { objectType } = req.params;
  const tableName = objectType.toUpperCase();

  try {
    const db = await openDb();

    const exists = await ensureTable(db, tableName);
    if (!exists) {
      return res.status(404).json({ error: `Tabelle ${tableName} nicht gefunden` });
    }

    const rows = await db.all(`SELECT * FROM ${tableName}`);
    if (!rows.length) {
      return res.status(404).json({ error: `Tabelle ${tableName} ist leer` });
    }

    const graph = rows.map((row, index) => {
      const idLocal = row.Objekt_Template_Kennung || `${tableName}_${row.id || index + 1}`;
      const obj = {
        "@id": `${BASE_URI}${idLocal}`,
        "@type": `${BASE_URI}${tableName}`,
      };
      for (const [k, v] of Object.entries(row)) {
        if (k === "id") continue;
        obj[k] = v ?? "";
      }
      return obj;
    });

    const jsonld = {
      "@context": { "@vocab": BASE_URI },
      "@graph": graph,
    };

    res.type("application/ld+json").send(JSON.stringify(jsonld, null, 2));
  } catch (err) {
    console.error("❌ Fehler in /ontology/:objectType/jsonld:", err);
    res.status(500).json({ error: "Fehler beim Generieren der JSON-LD-Ontologie" });
  }
});

export default router;
