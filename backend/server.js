import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import ontology from "./ontology.js";
import backupRouter from "./backup.js";

//import { startBacnetDevice, whoIsDevices } from "./bacnetDevice.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAX_BACKUPS = 3;

const app = express();
app.use(cors());
app.use(express.json());
app.use("/ontology", ontology);
app.use("/backup", backupRouter);



const dbPath = path.join(__dirname, "data.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Fehler beim Öffnen der DB:", err.message);
  else console.log("✅ SQLite DB geöffnet:", dbPath);
});

// --- Swagger Setup ---
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BACtwin API",
      version: "0.8.0",
      description: "API Dokumentation für BACtwin Backend (Gewerke, Anlagen etc.). ACHTUNG: Richtigen Server auswählen !!!",
    },
    servers: [
      { url: "http://amevbacnet:4000", description: "Host" },
      { url: "http://localhost:4000", description: "Lokaler Server", },
    ],
  },
  apis: ["./server.js"], // Dateien, in denen Swagger-Kommentare stehen
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//Starte BACnet Device
//Fixme:startBacnetDevice();

/**
 * @openapi
 * /ontology/{objectType}:
 *   get:
 *     summary: "BACtwin Ontologie im Turtle-Format"
 *     tags: [BACtwin Ontologie]
 *     description: >
 *       Erzeugt dynamisch eine BACtwin Ontologie (Turtle) aus der entsprechenden SQLite-Tabelle.
 *       Unterstützte Objekt-Typen: ai, ao, av, bi, bo, bv, mv, mi, mo, nc, ee, lp, sv, dev, cal, sch, tl usw.
 *     parameters:
 *       - name: objectType
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: ai
 *         description: >
 *           Name des Objekttyps (z. B. ai, ao, av, mv, lp …).
 *           Wird automatisch in Großbuchstaben konvertiert und mit der entsprechenden SQLite-Tabelle verknüpft.
 *     responses:
 *       '200':
 *         description: "Turtle-Dokument mit Ontologie"
 *         content:
 *           text/turtle:
 *             schema:
 *               type: string
 *       '404':
 *         description: "Tabelle nicht gefunden oder leer"
 *       '500':
 *         description: "Fehler beim Generieren der Ontologie"
 *
 * /ontology/{objectType}/jsonld:
 *   get:
 *     summary: "BACtwin Ontologie im JSON-LD-Format"
 *     tags: [BACtwin Ontologie]
 *     description: >
 *       Erzeugt dynamisch eine BACtwin Ontologie (JSON-LD) aus der entsprechenden SQLite-Tabelle.
 *     parameters:
 *       - name: objectType
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           example: ai
 *     responses:
 *       '200':
 *         description: "JSON-LD Ontologie"
 *         content:
 *           application/ld+json:
 *             schema:
 *               type: object
 *       '404':
 *         description: "Tabelle nicht gefunden oder leer"
 *       '500':
 *         description: "Fehler beim Generieren der JSON-LD Ontologie"
 */


/**
 *# @openapi
 *# /bacnet/whois:
 *#   get:
 *#     summary: Sendet einen Who-Is Befehl (Client) und zeigt gefundene Geräte
 *#     tags: [BACnet]
 *#     responses:
 *#       200:
 *#         description: Liste der Geräte
 */
app.get("/bacnet/whois", async (req, res) => {
  const result = await whoIsDevices();
  res.json(result);
});

// === Tabelle bei Bedarf automatisch erstellen ===
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS ObjectProperties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ObjectType TEXT NOT NULL,
      Property_Identifier TEXT NOT NULL,
      Conformance_Code TEXT NOT NULL,
      UNIQUE (ObjectType, Property_Identifier)
    );
  `);
});

/**
 * @openapi
 * openapi: 3.0.3
 * info:
 *   title: Object Properties API
 *   description: API zur Abfrage und Filterung von BACnet-ObjectProperties aus einer SQLite-Datenbank.
 *   version: 1.0.0
 *
 * servers:
 *   - url: http://localhost:4000
 *     description: Lokaler Entwicklungsserver
 *
 * paths:
 *   /properties:
 *     get:
 *       summary: Alle Objekt-Properties abrufen
 *       tags: [Profiles]
 *       description: >
 *         Gibt alle Zeilen der Tabelle **ObjectProperties** zurück, sortiert nach `ObjectType` und `id`.
 *       responses:
 *         '200':
 *           description: Liste aller ObjectProperties
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ObjectProperty'
 *         '500':
 *           description: Fehler beim Abrufen der Daten
 *
 *   /properties/{objectType}:
 *     get:
 *       summary: Properties eines bestimmten Objekt-Typs abrufen (mit optionalen Filtern)
 *       tags: [Profiles]
 *       description: >
 *         Gibt alle Properties eines bestimmten **ObjectType** (z. B. `AI`, `AO`, `AV` …) zurück.  
 *         Optional kann zusätzlich gefiltert werden nach:
 *         - `conformance`: Conformance_Code (z. B. `R` oder `!R`)
 *         - `property`: Teiltext im Property_Identifier
 *       parameters:
 *         - name: objectType
 *           in: path
 *           required: true
 *           description: Objekt-Typ (BACnet-Kurzbezeichnung)
 *           schema:
 *             type: string
 *             example: AI
 *         - name: conformance
 *           in: query
 *           required: false
 *           description: >
 *             Optionaler Filter nach Conformance_Code.  
 *             Beispiel: `R` für Einträge mit R, `!R` für alle außer R.
 *           schema:
 *             type: string
 *             example: "!R"
 *         - name: property
 *           in: query
 *           required: false
 *           description: >
 *             Optionaler Textfilter für Property_Identifier (Teiltextsuche).  
 *             Beispiel: `Value` findet alle Einträge, die "Value" enthalten.
 *           schema:
 *             type: string
 *             example: "Value"
 *       responses:
 *         '200':
 *           description: Gefilterte oder vollständige Liste der ObjectProperties
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ObjectProperty'
 *         '404':
 *           description: Keine passenden Einträge gefunden
 *         '500':
 *           description: Serverfehler beim Abrufen der Daten
 *
 * #components:
 * #  schemas:
 * #    ObjectProperty:
 * #      type: object
 * #      properties:
 * #        id:
 * #          type: integer
 * #          example: 1
 * #        ObjectType:
 * #          type: string
 * #          example: AI
 * #        Property_Identifier:
 * #          type: string
 * #          example: Present_Value
 * #        Conformance_Code:
 * #          type: string
 * #          example: W1
 */

app.get("/properties", (req, res) => {
  db.all("SELECT * FROM ObjectProperties ORDER BY ObjectType, id", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen Property-Datensatz anhand der Objekt_Template_Kennung abrufen
/*app.get("/properties/:objectType", (req, res) => {
  const { objectType } = req.params;
  db.all(
    "SELECT * FROM ObjectProperties WHERE ObjectType = ? ORDER BY id",
    [objectType],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});*/

// Erweiterte Abfrage: alle Properties eines ObjectType,
// optional gefiltert nach Conformance_Code (z. B. "R" oder "!R")
// und/oder Property_Identifier (Teiltext)
app.get("/properties/:objectType", (req, res) => {
  //console.log("Hallo Welt");
  const { objectType } = req.params;
  const { conformance, property } = req.query; // z. B. ?conformance=R oder ?conformance=!R&property=Value

  let sql = "SELECT * FROM ObjectProperties WHERE ObjectType = ?";
  const params = [objectType.toUpperCase()];

  // Optional: Filter nach Conformance_Code
  if (conformance) {
    if (conformance.startsWith("!")) {
      sql += " AND Conformance_Code NOT LIKE ?";
      params.push(`%${conformance.substring(1)}%`);
    } else {
      sql += " AND Conformance_Code LIKE ?";
      params.push(`%${conformance}%`);
    }
  }

  // Optional: Filter nach Property_Identifier
  if (property) {
    sql += " AND Property_Identifier LIKE ?";
    params.push(`%${property}%`);
  }

  sql += " ORDER BY id";

  //console.log(sql);

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0)
      return res.status(404).json({ error: "Keine Einträge gefunden" });
    res.json(rows);
  });
});


// --- AI API ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS AI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_1_1 TEXT,
    GA_FL_2_2_1 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Status_Flags TEXT,
    Event_State TEXT,
    Reliability TEXT,
    Out_Of_Service TEXT,
    Units TEXT,
    Min_Pres_Value TEXT,
    Max_Pres_Value TEXT,
    Resolution TEXT,
    COV_Increment TEXT,
    Time_Delay TEXT,
    Notification_Class TEXT,
    Low_Limit TEXT,
    High_Limit TEXT,
    Deadband TEXT,
    Limit_Enable TEXT,
    Event_Enable TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Event_Algorithm_Inhibit TEXT,
    Event_Algorithm_Inhibit_Ref TEXT,
    Time_Delay_Normal TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Version TEXT
  )`);
});

/**
 * @openapi
 * /ai:
 *   get:
 *     summary: Liste aller AI-Einträge abrufen
 *     tags: [AI-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreich abgerufen
 *#   post:
 *#     summary: Neuen AI-Eintrag hinzufügen
 *#     tags: [AI-Templates]
 *#     requestBody:
 *#       required: true
 *#       content:
 *#         application/json:
 *#           schema:
 *#             type: object
 *#             properties:
 *#               ObjSort_LfdNr: { type: string }
 *#               Objekt_Template_Kennung: { type: string }
 *#               Kommentar: { type: string }
 *#               Object_Name: { type: string }
 *#               Object_Identifier: { type: string }
 *#     responses:
 *#       201:
 *#         description: Eintrag erstellt
 * /ai/template/{kennung}:
 *   get:
 *     summary: Einzelnen AI-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [AI-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema:
 *           type: string
 *         example: AI_MW_T_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 */

app.get("/ai", (req, res) => {
  db.all("SELECT * FROM AI ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen AI-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/ai/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM AI WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

app.post("/ai", (req, res) => {
  const data = req.body;
  if (!data.ObjSort_LfdNr || !data.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });

  // UUID automatisch erzeugen
  data.UUID = data.UUID || crypto.randomUUID();

  const stmt = db.prepare(
    `INSERT INTO AI (
      ObjSort_LfdNr, UUID, Objekt_Template_Kennung, Kommentar,
      GA_FL_1_1_1, GA_FL_2_2_1, GA_FL_3_1_1, GA_FL_3_1_3,
      GA_FL_Abschnitte_Spalten, Object_Name, Description, Verwendung,
      Status_Flags, Event_State, Reliability, Out_Of_Service,
      Units, Min_Pres_Value, Max_Pres_Value, Resolution,
      COV_Increment, Time_Delay, Notification_Class, Low_Limit,
      High_Limit, Deadband, Limit_Enable, Event_Enable, Notify_Type,
      Event_Time_Stamps, Event_Message_Texts, Event_Message_Texts_Config,
      Event_Detection_Enable, Event_Algorithm_Inhibit, Event_Algorithm_Inhibit_Ref,
      Time_Delay_Normal, Reliability_Evaluation_Inhibit, Version
    ) VALUES (${Array(38).fill("?").join(",")})`
  );

  stmt.run(Object.values(data), function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, ...data });
  });
});

// === Tabelle AO anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS AO (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL,
    Kommentar TEXT,
    GA_FL_1_1_3 TEXT,
    GA_FL_1_2_1 TEXT,
    GA_FL_2_2_1 TEXT,
    GA_FL_2_2_2 TEXT,
    GA_FL_2_2_3 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Status_Flags TEXT,
    Event_State TEXT,
    Reliability TEXT,
    Out_Of_Service TEXT,
    Units TEXT,
    Min_Pres_Value TEXT,
    Max_Pres_Value TEXT,
    Resolution TEXT,
    Relinquish_Default TEXT,
    COV_Increment TEXT,
    Time_Delay TEXT,
    Notification_Class TEXT,
    Low_Limit TEXT,
    High_Limit TEXT,
    Deadband TEXT,
    Limit_Enable TEXT,
    Event_Enable TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Event_Algorithm_Inhibit TEXT,
    Event_Algorithm_Inhibit_Ref TEXT,
    Time_Delay_Normal TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Current_Command_Priority TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Doku ===
/**
 * @openapi
 * /ao:
 *   get:
 *     summary: Liste aller AO-Datensätze abrufen
 *     tags: [AO-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *#   post:
 *#     summary: Neuen AO-Datensatz anlegen
 *#     tags: [AO-Templates]
 *#     requestBody:
 *#       required: true
 *#       content:
 *#         application/json:
 *#           schema:
 *#             type: object
 *#             properties:
 *#               ObjSort_LfdNr: { type: string, example: "a201" }
 *#               Objekt_Template_Kennung: { type: string, example: "AO_ST_AMEV1" }
 *#               Kommentar: { type: string, example: "0-10V/4-20mA" }
 *#               Object_Name: { type: string, example: "[BAS]" }
 *#               Description: { type: string, example: "Stellsignal" }
 *#     responses:
 *#       201:
 *#         description: Datensatz erstellt
 *#
 *# /ao/{id}:
 *#   put:
 *#     summary: Bestehenden AO-Datensatz aktualisieren
 *#     tags: [AO-Templates]
 *#     parameters:
 *#       - in: path
 *#         name: id
 *#         required: true
 *#         schema: { type: integer }
 *#     responses:
 *#       200:
 *#         description: Datensatz aktualisiert
 *#   delete:
 *#     summary: AO-Datensatz löschen
 *#     tags: [AO-Templates]
 *#     parameters:
 *#       - in: path
 *#         name: id
 *#         required: true
 *#         schema: { type: integer }
 *#     responses:
 *#       200:
 *#         description: Datensatz gelöscht
 * /ao/template/{kennung}:
 *   get:
 *     summary: Einzelnen AO-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [AO-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema:
 *           type: string
 *         example: AO_ST_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 */


// Alle AO-Datensätze abrufen
app.get("/ao", (req, res) => {
  db.all("SELECT * FROM AO ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen AO-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/ao/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM AO WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen Datensatz anlegen
app.post("/ao", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO AO (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// Datensatz aktualisieren
app.put("/ao/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(req.body);

  db.run(`UPDATE AO SET ${updates} WHERE id = ?`, [...values, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Datensatz löschen
app.delete("/ao/:id", (req, res) => {
  db.run("DELETE FROM AO WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});



// === Tabelle AV anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS AV (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL,
    Kommentar TEXT,
    GA_FL_1_1_3 TEXT,
    GA_FL_1_2_1 TEXT,
    GA_FL_2_2_1 TEXT,
    GA_FL_2_2_2 TEXT,
    GA_FL_2_2_3 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Status_Flags TEXT,
    Event_State TEXT,
    Reliability TEXT,
    Out_Of_Service TEXT,
    Units TEXT,
    Min_Pres_Value TEXT,
    Max_Pres_Value TEXT,
    Resolution TEXT,
    Relinquish_Default TEXT,
    COV_Increment TEXT,
    Time_Delay TEXT,
    Notification_Class TEXT,
    Low_Limit TEXT,
    High_Limit TEXT,
    Deadband TEXT,
    Limit_Enable TEXT,
    Event_Enable TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Event_Algorithm_Inhibit TEXT,
    Event_Algorithm_Inhibit_Ref TEXT,
    Time_Delay_Normal TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Current_Command_Priority TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /av:
 *   get:
 *     summary: Liste aller AV-Datensätze abrufen
 *     tags: [AV-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neuen AV-Datensatz anlegen
 * #    tags: [AV-Templates]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              ObjSort_LfdNr: { type: string, example: "a301" }
 * #              Objekt_Template_Kennung: { type: string, example: "AV_ST_AMEV1" }
 * #              Kommentar: { type: string, example: "0-10V/4-20mA" }
 * #              Object_Name: { type: string, example: "[BAS]" }
 * #              Description: { type: string, example: "Stellsignal" }
 * #    responses:
 * #      201:
 * #        description: Datensatz erstellt
 * /av/template/{kennung}:
 *   get:
 *     summary: Einzelnen AV-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [AV-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema:
 *           type: string
 *         example: AV_ST_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 * #/av/{id}:
 * #  put:
 * #    summary: Bestehenden AV-Datensatz aktualisieren
 * #    tags: [AV-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema: { type: integer }
 * #    responses:
 * #      200:
 * #        description: Datensatz aktualisiert
 * #  delete:
 * #    summary: AV-Datensatz löschen
 * #    tags: [AV-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema: { type: integer }
 * #    responses:
 * #      200:
 * #        description: Datensatz gelöscht
 */

// Alle AV-Datensätze abrufen
app.get("/av", (req, res) => {
  db.all("SELECT * FROM AV ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen AV-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/av/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM AV WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Einzelnen Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/av/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM AV WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});


// Neuen AV-Datensatz anlegen
app.post("/av", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO AV (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// AV-Datensatz aktualisieren
app.put("/av/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(req.body);

  db.run(`UPDATE AV SET ${updates} WHERE id = ?`, [...values, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// AV-Datensatz löschen
app.delete("/av/:id", (req, res) => {
  db.run("DELETE FROM AV WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


// === Tabelle BI (Binary Input) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS BI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_1_2 TEXT,
    GA_FL_2_2_1 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Status_Flags TEXT,
    Event_State TEXT,
    Reliability TEXT,
    Out_Of_Service TEXT,
    Polarity TEXT,
    Inactive_Text TEXT,
    Active_Text TEXT,
    Change_Of_State_Count TEXT,
    Elapsed_Active_Time TEXT,
    Time_Delay TEXT,
    Notification_Class TEXT,
    Alarm_Value TEXT,
    Event_Enable TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Event_Algorithm_Inhibit TEXT,
    Event_Algorithm_Inhibit_Ref TEXT,
    Time_Delay_Normal TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /bi:
 *   get:
 *     summary: Liste aller BI-Datensätze abrufen
 *     tags: [BI-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neuen BI-Datensatz anlegen
 * #    tags: [BI-Templates]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              ObjSort_LfdNr: { type: string, example: "a401" }
 * #              Objekt_Template_Kennung: { type: string, example: "BI_GM_AMEV1" }
 * #              Kommentar: { type: string, example: "" }
 * #              Object_Name: { type: string, example: "[BAS]" }
 * #              Description: { type: string, example: "Gefahrmeldung" }
 * #    responses:
 * #      201:
 * #        description: Datensatz erstellt
 *
 * /bi/template/{kennung}:
 *   get:
 *     summary: Einzelnen BI-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [BI-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema:
 *           type: string
 *         example: BI_GM_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 *
 * #/bi/{id}:
 * #  put:
 * #    summary: Bestehenden BI-Datensatz aktualisieren
 * #    tags: [BI-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema: { type: integer }
 * #    responses:
 * #      200:
 * #        description: Datensatz aktualisiert
 * #  delete:
 * #    summary: BI-Datensatz löschen
 * #    tags: [BI-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema: { type: integer }
 * #    responses:
 * #      200:
 * #        description: Datensatz gelöscht
 */

// === ROUTEN ===

// Alle BI-Datensätze abrufen
app.get("/bi", (req, res) => {
  db.all("SELECT * FROM BI ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen BI-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/bi/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM BI WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen BI-Datensatz anlegen
app.post("/bi", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO BI (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// BI-Datensatz aktualisieren
app.put("/bi/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(req.body);

  db.run(`UPDATE BI SET ${updates} WHERE id = ?`, [...values, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// BI-Datensatz löschen
app.delete("/bi/:id", (req, res) => {
  db.run("DELETE FROM BI WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// === Tabelle BO (Binary Output) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS BO (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_1_4 TEXT,
    GA_FL_1_2_2 TEXT,
    GA_FL_2_2_1 TEXT,
    GA_FL_2_2_41 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Status_Flags TEXT,
    Event_State TEXT,
    Reliability TEXT,
    Out_Of_Service TEXT,
    Polarity TEXT,
    Inactive_Text TEXT,
    Active_Text TEXT,
    Change_Of_State_Count TEXT,
    Elapsed_Active_Time TEXT,
    Minimum_Off_Time TEXT,
    Minimum_On_Time TEXT,
    Relinquish_Default TEXT,
    Time_Delay TEXT,
    Notification_Class TEXT,
    Alarm_Value TEXT,
    Feedback_Value TEXT,
    Event_Enable TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Event_Algorithm_Inhibit TEXT,
    Event_Algorithm_Inhibit_Ref TEXT,
    Time_Delay_Normal TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Current_Command_Priority TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /bo:
 *   get:
 *     summary: Liste aller BO-Datensätze abrufen
 *     tags: [BO-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *
 * /bo/template/{kennung}:
 *   get:
 *     summary: Einzelnen BO-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [BO-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema: { type: string }
 *         example: BO_SB_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 */

// === ROUTEN ===

// Alle Datensätze abrufen
app.get("/bo", (req, res) => {
  db.all("SELECT * FROM BO ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen Datensatz anhand Objekt_Template_Kennung abrufen
app.get("/bo/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM BO WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen Datensatz anlegen
app.post("/bo", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);
  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });
  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO BO (${keys.join(",")}) VALUES (${placeholders})`;
  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// Datensatz aktualisieren
app.put("/bo/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body).map(k => `${k} = ?`).join(", ");
  db.run(`UPDATE BO SET ${updates} WHERE id = ?`, [...Object.values(req.body), id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Datensatz löschen
app.delete("/bo/:id", (req, res) => {
  db.run("DELETE FROM BO WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// === Tabelle BV (Binary Value) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS BV (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_1_4 TEXT,
    GA_FL_1_2_2 TEXT,
    GA_FL_2_2_1 TEXT,
    GA_FL_2_2_41 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Status_Flags TEXT,
    Event_State TEXT,
    Reliability TEXT,
    Out_Of_Service TEXT,
    Inactive_Text TEXT,
    Active_Text TEXT,
    Change_Of_State_Count TEXT,
    Elapsed_Active_Time TEXT,
    Minimum_Off_Time TEXT,
    Minimum_On_Time TEXT,
    Relinquish_Default TEXT,
    Time_Delay TEXT,
    Notification_Class TEXT,
    Alarm_Value TEXT,
    Feedback_Value TEXT,
    Event_Enable TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Event_Algorithm_Inhibit TEXT,
    Event_Algorithm_Inhibit_Ref TEXT,
    Time_Delay_Normal TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Current_Command_Priority TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /bv:
 *   get:
 *     summary: Liste aller BV-Datensätze abrufen
 *     tags: [BV-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *
 * /bv/template/{kennung}:
 *   get:
 *     summary: Einzelnen BV-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [BV-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema: { type: string }
 *         example: BV_SB_AAF_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 */

// === ROUTEN ===

// Alle Datensätze abrufen
app.get("/bv", (req, res) => {
  db.all("SELECT * FROM BV ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen Datensatz anhand Objekt_Template_Kennung abrufen
app.get("/bv/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM BV WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen Datensatz anlegen
app.post("/bv", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);
  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });
  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO BV (${keys.join(",")}) VALUES (${placeholders})`;
  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// Datensatz aktualisieren
app.put("/bv/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body).map(k => `${k} = ?`).join(", ");
  db.run(`UPDATE BV SET ${updates} WHERE id = ?`, [...Object.values(req.body), id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Datensatz löschen
app.delete("/bv/:id", (req, res) => {
  db.run("DELETE FROM BV WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// === Tabelle DEV (Device) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS DEV (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_3_5 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Bemerkung TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Location TEXT,
    Protocol_Version TEXT,
    Protocol_Revision TEXT,
    Protocol_Services_Supported TEXT,
    Protocol_Object_Types_Supported TEXT,
    Local_Time TEXT,
    Local_Date TEXT,
    UTC_Offset TEXT,
    Time_Synchronization_Recipients TEXT,
    Max_Master TEXT,
    Max_Info_Frames TEXT,
    UTC_Time_Synchronization_Recipients TEXT,
    Time_Synchronization_Interval TEXT,
    Align_Intervals TEXT,
    Interval_Offset TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /dev:
 *   get:
 *     summary: Liste aller DEV-Datensätze abrufen
 *     tags: [DEV-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *
 * /dev/template/{kennung}:
 *   get:
 *     summary: Einzelnen DEV-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [DEV-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema: { type: string }
 *         example: DEV_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 */

// === ROUTEN ===

// Alle DEV-Datensätze abrufen
app.get("/dev", (req, res) => {
  db.all("SELECT * FROM DEV ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen DEV-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/dev/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM DEV WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen DEV-Datensatz anlegen
app.post("/dev", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO DEV (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// DEV-Datensatz aktualisieren
app.put("/dev/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body).map(k => `${k} = ?`).join(", ");
  const params = [...Object.values(req.body), id];

  db.run(`UPDATE DEV SET ${updates} WHERE id = ?`, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// DEV-Datensatz löschen
app.delete("/dev/:id", (req, res) => {
  db.run("DELETE FROM DEV WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


// === Tabelle CAL anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS CAL (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_3_2 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Date_List TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /cal:
 *   get:
 *     summary: Liste aller CAL-Datensätze abrufen
 *     tags: [CAL-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neuen AV-Datensatz anlegen
 * #    tags: [CAL-Templates]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              ObjSort_LfdNr: { type: string, example: "a301" }
 * #              Objekt_Template_Kennung: { type: string, example: "AV_ST_AMEV1" }
 * #              Kommentar: { type: string, example: "0-10V/4-20mA" }
 * #              Object_Name: { type: string, example: "[BAS]" }
 * #              Description: { type: string, example: "Stellsignal" }
 * #    responses:
 * #      201:
 * #        description: Datensatz erstellt
 * /cal/template/{kennung}:
 *   get:
 *     summary: Einzelnen CAL-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [CAL-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema:
 *           type: string
 *         example: CAL_FT_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 * #/cal/{id}:
 * #  put:
 * #    summary: Bestehenden AV-Datensatz aktualisieren
 * #    tags: [CAL-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema: { type: integer }
 * #    responses:
 * #      200:
 * #        description: Datensatz aktualisiert
 * #  delete:
 * #    summary: CAL-Datensatz löschen
 * #    tags: [CAL-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema: { type: integer }
 * #    responses:
 * #      200:
 * #        description: Datensatz gelöscht
 */

// Alle CAL-Datensätze abrufen
app.get("/cal", (req, res) => {
  db.all("SELECT * FROM CAL ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen CAL-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/cal/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM CAL WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen CAL-Datensatz anlegen
app.post("/cal", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO CAL (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// CAL-Datensatz aktualisieren
app.put("/cal/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(req.body);

  db.run(`UPDATE CAL SET ${updates} WHERE id = ?`, [...values, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// CAL-Datensatz löschen
app.delete("/cal/:id", (req, res) => {
  db.run("DELETE FROM CAL WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// === Tabelle SCH (Scheduler) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS SCH (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_3_1 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Effective_Period TEXT,
    Weekly_Schedule TEXT,
    Exception_Schedule TEXT,
    Schedule_Default TEXT,
    List_Of_Object_Property_References TEXT,
    Priority_For_Writing TEXT,
    Status_Flags TEXT,
    Reliability TEXT,
    Out_Of_Service TEXT,
    Notification_Class TEXT,
    Event_Enable TEXT,
    Event_State TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /sch:
 *   get:
 *     summary: Liste aller SCH-Datensätze abrufen
 *     tags: [SCH-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *
 * /sch/template/{kennung}:
 *   get:
 *     summary: Einzelnen SCH-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [SCH-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema: { type: string }
 *         example: SCH_BN_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 *
 * # Die folgenden Operationen kannst du bei Bedarf einkommentieren:
 * #/sch:
 * #  post:
 * #    summary: Neuen SCH-Datensatz anlegen
 * #    tags: [SCH-Templates]
 * #    responses: { 201: { description: Datensatz erstellt } }
 * #/sch/{id}:
 * #  put:
 * #    summary: SCH-Datensatz aktualisieren
 * #    tags: [SCH-Templates]
 * #  delete:
 * #    summary: SCH-Datensatz löschen
 * #    tags: [SCH-Templates]
 */

// === ROUTEN ===

// Alle SCH-Datensätze abrufen
app.get("/sch", (req, res) => {
  db.all("SELECT * FROM SCH ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen SCH-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/sch/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM SCH WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen SCH-Datensatz anlegen
app.post("/sch", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO SCH (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// SCH-Datensatz aktualisieren
app.put("/sch/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body).map(k => `${k} = ?`).join(", ");
  const params = [...Object.values(req.body), id];

  db.run(`UPDATE SCH SET ${updates} WHERE id = ?`, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// SCH-Datensatz löschen
app.delete("/sch/:id", (req, res) => {
  db.run("DELETE FROM SCH WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});



// --- NC API ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS NC (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Object_Identifier TEXT NOT NULL UNIQUE,
    Description TEXT,
    Priority TEXT,
    Ack_Required TEXT,
    Recipient_List TEXT,
    changed TEXT
  )`);
});

/**
 * @openapi
 * /nc:
 *   get:
 *     summary: Liste aller NC-Einträge abrufen
 *     tags: [NC-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neuen NC-Eintrag anlegen
 * #    tags: [NC-Templates]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              ObjSort_LfdNr:
 * #                type: string
 * #                example: b101
 * #              UUID:
 * #                type: string
 * #                example: dad1a77f-0ae8-4bdb-aa7a-66bb17ec81e0
 * #              Objekt_Template_Kennung:
 * #               type: string
 * #                example: NC_GM_PSA_AMEV1
 * #              Kommentar:
 * #                type: string
 * #                example: gemäß Vorgaben Recipient_List
 * #              Object_Identifier:
 * #                type: string
 * #                example: NC100
 * #              Object_Name:
 * #                type: string
 * #                example: [BAS]
 * #              Description:
 * #                type: string
 * #                example: Meldeklasse Gefahr Personen
 * #              Priority:
 * #                type: string
 * #                example: {10,11,110}
 * #              Ack_Required:
 * #                type: string
 * #                example: 
 * #              Recipient_List:
 * #                type: string
 * #                example: [gemäß Vorgaben Recipient_List]
 * #    responses:
 * #      201:
 * #        description: NC-Eintrag erstellt
 *#
 *# /nc/{id}:
 *#   put:
 *#     summary: Bestehenden NC-Eintrag aktualisieren
 *#     tags: [NC-Templates]
 *#     parameters:
 *#       - in: path
 *#         name: id
 *#         required: true
 *#         schema:
 *#           type: integer
 *#     requestBody:
 *#       content:
 *#         application/json:
 *#           schema:
 *#             type: object
 *#     responses:
 *#       200:
 *#         description: NC-Eintrag aktualisiert
 * /nc/template/{kennung}:
 *   get:
 *     summary: Einzelnen Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [NC-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema:
 *           type: string
 *         example: NC_SM_GA_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 */

app.get("/nc", (req, res) => {
  db.all("SELECT * FROM NC ORDER BY id ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen NC-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/nc/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM NC WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

app.post("/nc", (req, res) => {
  const {
    ObjSort_LfdNr,
    UUID,
    Objekt_Template_Kennung,
    Kommentar,
    GA_FL_3_1_1,
    GA_FL_3_1_3,
    GA_FL_Abschnitte_Spalten,
    Object_Name,
    Object_Identifier,
    Description,
    Priority,
    Ack_Required,
    Recipient_List,
  } = req.body;

  // Pflichtfelder prüfen
  if (!ObjSort_LfdNr || !UUID || !Objekt_Template_Kennung || !Object_Identifier) {
    return res.status(400).json({ error: "Pflichtfelder fehlen." });
  }

  const sql = `
    INSERT INTO NC (
      ObjSort_LfdNr, UUID, Objekt_Template_Kennung, Kommentar,
      GA_FL_3_1_1, GA_FL_3_1_3, GA_FL_Abschnitte_Spalten,
      Object_Name, Object_Identifier, Description,
      Priority, Ack_Required, Recipient_List, changed
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;

  const params = [
    ObjSort_LfdNr,
    UUID,
    Objekt_Template_Kennung,
    Kommentar,
    GA_FL_3_1_1,
    GA_FL_3_1_3,
    GA_FL_Abschnitte_Spalten,
    Object_Name,
    Object_Identifier,
    Description,
    Priority,
    Ack_Required,
    Recipient_List,
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      id: this.lastID,
      ObjSort_LfdNr,
      UUID,
      Objekt_Template_Kennung,
      Kommentar,
      Object_Identifier,
      changed: new Date().toISOString(),
    });
  });
});

app.put("/nc/:id", (req, res) => {
  const { id } = req.params;
  const {
    ObjSort_LfdNr,
    UUID,
    Objekt_Template_Kennung,
    Kommentar,
    GA_FL_3_1_1,
    GA_FL_3_1_3,
    GA_FL_Abschnitte_Spalten,
    Object_Name,
    Object_Identifier,
    Description,
    Priority,
    Ack_Required,
    Recipient_List,
  } = req.body;

  const sql = `
    UPDATE NC SET
      ObjSort_LfdNr = ?, UUID = ?, Objekt_Template_Kennung = ?, Kommentar = ?,
      GA_FL_3_1_1 = ?, GA_FL_3_1_3 = ?, GA_FL_Abschnitte_Spalten = ?,
      Object_Name = ?, Object_Identifier = ?, Description = ?,
      Priority = ?, Ack_Required = ?, Recipient_List = ?, changed = datetime('now')
    WHERE id = ?
  `;

  const params = [
    ObjSort_LfdNr,
    UUID,
    Objekt_Template_Kennung,
    Kommentar,
    GA_FL_3_1_1,
    GA_FL_3_1_3,
    GA_FL_Abschnitte_Spalten,
    Object_Name,
    Object_Identifier,
    Description,
    Priority,
    Ack_Required,
    Recipient_List,
    id,
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// === Tabelle EE (Event Enrollment) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS EE (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_3_5 TEXT,
    GA_FL_2_2_1 TEXT,
    GA_FL_2_2_4 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Bemerkung TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Event_Type TEXT,
    Notify_Type TEXT,
    Event_Parameters TEXT,
    Object_Property_Reference TEXT,
    Event_State TEXT,
    Event_Enable TEXT,
    Notification_Class TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Event_Algorithm_Inhibit_Ref TEXT,
    Time_Delay_Normal TEXT,
    Status_Flags TEXT,
    Reliability TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /ee:
 *   get:
 *     summary: Liste aller EE-Datensätze abrufen
 *     tags: [EE-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *
 * /ee/template/{kennung}:
 *   get:
 *     summary: Einzelnen EE-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [EE-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema: { type: string }
 *         example: EE_COV_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 */

// === ROUTEN ===

// Alle EE-Datensätze abrufen
app.get("/ee", (req, res) => {
  db.all("SELECT * FROM EE ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen EE-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/ee/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM EE WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen EE-Datensatz anlegen
app.post("/ee", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO EE (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// EE-Datensatz aktualisieren
app.put("/ee/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body).map(k => `${k} = ?`).join(", ");
  const params = [...Object.values(req.body), id];

  db.run(`UPDATE EE SET ${updates} WHERE id = ?`, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// EE-Datensatz löschen
app.delete("/ee/:id", (req, res) => {
  db.run("DELETE FROM EE WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// === Tabelle MI (Multistate Input) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS MI (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_1_2 TEXT,
    GA_FL_2_2_1 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Status_Flags TEXT,
    Event_State TEXT,
    Reliability TEXT,
    Out_Of_Service TEXT,
    Number_Of_States TEXT,
    State_Text TEXT,
    Time_Delay TEXT,
    Notification_Class TEXT,
    Alarm_Values TEXT,
    Fault_Values TEXT,
    Event_Enable TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Event_Algorithm_Inhibit_Ref TEXT,
    Time_Delay_Normal TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /mi:
 *   get:
 *     summary: Liste aller MI-Datensätze abrufen
 *     tags: [MI-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *
 * /mi/template/{kennung}:
 *   get:
 *     summary: Einzelnen MI-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [MI-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema:
 *           type: string
 *         example: MI_HD_AEM_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 */

// === ROUTEN ===

// Alle MI-Datensätze abrufen
app.get("/mi", (req, res) => {
  db.all("SELECT * FROM MI ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen MI-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/mi/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM MI WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen MI-Datensatz anlegen
app.post("/mi", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung || !req.body.UUID)
    return res.status(400).json({ error: "Pflichtfelder fehlen (ObjSort_LfdNr, Objekt_Template_Kennung, UUID)." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO MI (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// === Tabelle MO (Multistate Output) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS MO (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_1_2 TEXT,
    GA_FL_1_2_2 TEXT,
    GA_FL_2_2_1 TEXT,
    GA_FL_2_2_4 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Status_Flags TEXT,
    Event_State TEXT,
    Reliability TEXT,
    Out_Of_Service TEXT,
    Number_Of_States TEXT,
    State_Text TEXT,
    Relinquish_Default TEXT,
    Time_Delay TEXT,
    Notification_Class TEXT,
    Feedback_Value TEXT,
    Alarm_Values TEXT,
    Fault_Values TEXT,
    Event_Enable TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Event_Algorithm_Inhibit_Ref TEXT,
    Time_Delay_Normal TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Current_Command_Priority TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /mo:
 *   get:
 *     summary: Liste aller MO-Datensätze abrufen
 *     tags: [MO-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *
 * #  post:
 * #    summary: Neuen MO-Datensatz anlegen
 * #    tags: [MO-Templates]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              ObjSort_LfdNr:
 * #                type: string
 * #                example: "a801"
 * #              Objekt_Template_Kennung:
 * #                type: string
 * #                example: "MO_SB_2n_AMEV1"
 * #              Kommentar:
 * #                type: string
 * #                example: "Mehrstufiger Ausgang"
 * #              Object_Name:
 * #                type: string
 * #                example: "[BAS]"
 * #              Description:
 * #                type: string
 * #                example: "Schaltbefehl 2 Stufig"
 * #    responses:
 * #      201:
 * #        description: Datensatz erstellt
 * #
 * /mo/template/{kennung}:
 *   get:
 *     summary: Einzelnen MO-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [MO-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema:
 *           type: string
 *         example: MO_SB_2n_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 *
 * #/mo/{id}:
 * #  put:
 * #    summary: Bestehenden MO-Datensatz aktualisieren
 * #    tags: [MO-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    responses:
 * #      200:
 * #        description: Datensatz aktualisiert
 * #
 * #  delete:
 * #    summary: MO-Datensatz löschen
 * #    tags: [MO-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    responses:
 * #      200:
 * #        description: Datensatz gelöscht
 */

// === ROUTEN ===

// Alle MO-Datensätze abrufen
app.get("/mo", (req, res) => {
  db.all("SELECT * FROM MO ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen MO-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/mo/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM MO WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen MO-Datensatz anlegen
app.post("/mo", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung || !req.body.UUID)
    return res.status(400).json({ error: "Pflichtfelder fehlen (ObjSort_LfdNr, Objekt_Template_Kennung, UUID)." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO MO (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// MO-Datensatz aktualisieren
app.put("/mo/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(req.body);

  db.run(`UPDATE MO SET ${updates} WHERE id = ?`, [...values, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// MO-Datensatz löschen
app.delete("/mo/:id", (req, res) => {
  db.run("DELETE FROM MO WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// === Tabelle MV (Multistate Value) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS MV (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_1_2 TEXT,
    GA_FL_1_2_2 TEXT,
    GA_FL_2_2_1 TEXT,
    GA_FL_2_2_4 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Status_Flags TEXT,
    Event_State TEXT,
    Reliability TEXT,
    Out_Of_Service TEXT,
    Number_Of_States TEXT,
    State_Text TEXT,
    Relinquish_Default TEXT,
    Time_Delay TEXT,
    Notification_Class TEXT,
    Alarm_Values TEXT,
    Fault_Values TEXT,
    Event_Enable TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Event_Algorithm_Inhibit_Ref TEXT,
    Time_Delay_Normal TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Current_Command_Priority TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /mv:
 *   get:
 *     summary: Liste aller MV-Datensätze abrufen
 *     tags: [MV-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *
 * #  post:
 * #    summary: Neuen MV-Datensatz anlegen
 * #    tags: [MV-Templates]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              UUID:
 * #                type: string
 * #                example: "267ded4b-eaf4-4ee5-8b89-f14f99851646"
 * #              Objekt_Template_Kennung:
 * #                type: string
 * #                example: "MV_AS_M_AMEV1"
 * #              Object_Name:
 * #                type: string
 * #                example: "[BAS]"
 * #              Description:
 * #                type: string
 * #                example: "Anlagensteuerung"
 * #    responses:
 * #      201:
 * #        description: Datensatz erstellt
 * #
 * /mv/template/{kennung}:
 *   get:
 *     summary: Einzelnen MV-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [MV-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema:
 *           type: string
 *         example: MV_AS_M_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 *
 * #/mv/{id}:
 * #  put:
 * #    summary: Bestehenden MV-Datensatz aktualisieren
 * #    tags: [MV-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    responses:
 * #      200:
 * #        description: Datensatz aktualisiert
 * #
 * #  delete:
 * #    summary: MV-Datensatz löschen
 * #    tags: [MV-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    responses:
 * #      200:
 * #        description: Datensatz gelöscht
 */

// === ROUTEN ===

// Alle MV-Datensätze abrufen
app.get("/mv", (req, res) => {
  db.all("SELECT * FROM MV ORDER BY Objekt_Template_Kennung ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen MV-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/mv/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get("SELECT * FROM MV WHERE Objekt_Template_Kennung = ?", [kennung], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
    res.json(row);
  });
});

// Neuen MV-Datensatz anlegen
app.post("/mv", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.UUID || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen (UUID, Objekt_Template_Kennung)." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO MV (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// MV-Datensatz aktualisieren
app.put("/mv/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body).map(k => `${k} = ?`).join(", ");
  const values = Object.values(req.body);

  db.run(`UPDATE MV SET ${updates} WHERE id = ?`, [...values, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// MV-Datensatz löschen
app.delete("/mv/:id", (req, res) => {
  db.run("DELETE FROM MV WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


// === Tabelle LP (Loop Object) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS LP (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_3_5 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_Bemerkung TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Status_Flags TEXT,
    Event_State TEXT,
    Reliability TEXT,
    Out_Of_Service TEXT,
    Output_Units TEXT,
    Manipulated_Variable_Reference TEXT,
    Controlled_Variable_Reference TEXT,
    Controlled_Variable_Units TEXT,
    Setpoint_Reference TEXT,
    Action TEXT,
    Proportional_Constant TEXT,
    Proportional_Constant_Units TEXT,
    Integral_Constant TEXT,
    Integral_Constant_Units TEXT,
    Derivative_Constant TEXT,
    Derivative_Constant_Units TEXT,
    Maximum_Output TEXT,
    Minimum_Output TEXT,
    Priority_For_Writing TEXT,
    COV_Increment TEXT,
    Time_Delay TEXT,
    Notification_Class TEXT,
    Event_Enable TEXT,
    Time_Delay_Normal TEXT,
    Error_Limit TEXT,
    Deadband TEXT,
    Low_Diff_Limit TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Event_Algorithm_Inhibit_Ref TEXT,
    Reliability_Evaluation_Inhibit TEXT,
    Version TEXT
  )`);
});

/**
 * @openapi
 * /lp:
 *   get:
 *     summary: Liste aller LP-Datensätze abrufen
 *     tags: [LP-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *
 * #  post:
 * #    summary: Neuen LP-Datensatz anlegen
 * #    tags: [LP-Templates]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              ObjSort_LfdNr:
 * #                type: string
 * #                example: "e101"
 * #              UUID:
 * #                type: string
 * #                example: "57a42cd9-46a9-4981-abbe-2e6a9df38efe"
 * #              Objekt_Template_Kennung:
 * #                type: string
 * #                example: "LP_AN_AMEV1"
 * #              Kommentar:
 * #                type: string
 * #                example: ""
 * #              Object_Name:
 * #                type: string
 * #                example: "[BAS]"
 * #              Description:
 * #                type: string
 * #                example: "Regler"
 * #    responses:
 * #      201:
 * #        description: Datensatz erstellt
 * #
 * /lp/template/{kennung}:
 *   get:
 *     summary: Einzelnen LP-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [LP-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema:
 *           type: string
 *         example: LP_AN_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 *
 * #/lp/{id}:
 * #  put:
 * #    summary: Bestehenden LP-Datensatz aktualisieren
 * #    tags: [LP-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    responses:
 * #      200:
 * #        description: Datensatz aktualisiert
 * #
 * #  delete:
 * #    summary: LP-Datensatz löschen
 * #    tags: [LP-Templates]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    responses:
 * #      200:
 * #        description: Datensatz gelöscht
 */


// === ROUTEN ===

// Alle LP-Datensätze abrufen
app.get("/lp", (req, res) => {
  db.all("SELECT * FROM LP ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen LP-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/lp/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM LP WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen LP-Datensatz anlegen
app.post("/lp", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung || !req.body.UUID)
    return res.status(400).json({ error: "Pflichtfelder fehlen (ObjSort_LfdNr, Objekt_Template_Kennung, UUID)." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO LP (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// LP-Datensatz aktualisieren
app.put("/lp/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(req.body);

  db.run(`UPDATE LP SET ${updates} WHERE id = ?`, [...values, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// LP-Datensatz löschen
app.delete("/lp/:id", (req, res) => {
  db.run("DELETE FROM LP WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


// === Tabelle TL (Trend Log) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS TL (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_3_4 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Enable TEXT,
    Log_DeviceObjectProperty TEXT,
    Log_Interval TEXT,
    COV_Resubscription_Interval4 TEXT,
    Client_COV_Increment TEXT,
    Stop_When_Full TEXT,
    Buffer_Size TEXT,
    Logging_Type TEXT,
    Trigger TEXT,
    Status_Flags TEXT,
    Reliability TEXT,
    Notification_Threshold TEXT,
    Event_State TEXT,
    Notification_Class TEXT,
    Event_Enable TEXT,
    Notify_Type TEXT,
    Event_Time_Stamps TEXT,
    Event_Message_Texts_Config TEXT,
    Event_Detection_Enable TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /tl:
 *   get:
 *     summary: Liste aller TL-Datensätze abrufen
 *     tags: [TL-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *
 * /tl/template/{kennung}:
 *   get:
 *     summary: Einzelnen TL-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [TL-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema: { type: string }
 *         example: TL_AN_P_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 */

// === ROUTEN ===

// Alle TL-Datensätze abrufen
app.get("/tl", (req, res) => {
  db.all("SELECT * FROM TL ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen TL-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/tl/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM TL WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen TL-Datensatz anlegen
app.post("/tl", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO TL (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// TL-Datensatz aktualisieren
app.put("/tl/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body).map(k => `${k} = ?`).join(", ");
  const params = [...Object.values(req.body), id];

  db.run(`UPDATE TL SET ${updates} WHERE id = ?`, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// TL-Datensatz löschen
app.delete("/tl/:id", (req, res) => {
  db.run("DELETE FROM TL WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// === Tabelle SV (Structured View) anlegen ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS SV (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ObjSort_LfdNr TEXT NOT NULL,
    UUID TEXT NOT NULL UNIQUE,
    Objekt_Template_Kennung TEXT NOT NULL UNIQUE,
    Kommentar TEXT,
    GA_FL_1_3_5 TEXT,
    GA_FL_3_1_1 TEXT,
    GA_FL_3_1_3 TEXT,
    GA_FL_Bemerkung TEXT,
    GA_FL_Abschnitte_Spalten TEXT,
    Object_Name TEXT,
    Description TEXT,
    Verwendung TEXT,
    Node_Type TEXT,
    Node_Subtype TEXT,
    Subordinate_List TEXT,
    Version TEXT
  )`);
});

// === OpenAPI Beschreibung ===
/**
 * @openapi
 * /sv:
 *   get:
 *     summary: Liste aller SV-Datensätze abrufen
 *     tags: [SV-Templates]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 *
 * /sv/template/{kennung}:
 *   get:
 *     summary: Einzelnen SV-Datensatz anhand der Objekt_Template_Kennung abrufen
 *     tags: [SV-Templates]
 *     parameters:
 *       - in: path
 *         name: kennung
 *         required: true
 *         schema: { type: string }
 *         example: SV_ANL_AMEV1
 *     responses:
 *       200:
 *         description: Gefundener Datensatz
 *       404:
 *         description: Kein Datensatz gefunden
 *
 * #/sv:
 * #  post:
 * #    summary: Neuen SV-Datensatz anlegen
 * #    tags: [SV-Templates]
 * #    responses: { 201: { description: Datensatz erstellt } }
 * #/sv/{id}:
 * #  put:
 * #    summary: SV-Datensatz aktualisieren
 * #    tags: [SV-Templates]
 * #  delete:
 * #    summary: SV-Datensatz löschen
 * #    tags: [SV-Templates]
 */

// === ROUTEN ===

// Alle SV-Datensätze abrufen
app.get("/sv", (req, res) => {
  db.all("SELECT * FROM SV ORDER BY ObjSort_LfdNr ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Einzelnen SV-Datensatz anhand der Objekt_Template_Kennung abrufen
app.get("/sv/template/:kennung", (req, res) => {
  const { kennung } = req.params;
  db.get(
    "SELECT * FROM SV WHERE Objekt_Template_Kennung = ?",
    [kennung],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Kein Datensatz gefunden" });
      res.json(row);
    }
  );
});

// Neuen SV-Datensatz anlegen
app.post("/sv", (req, res) => {
  const keys = Object.keys(req.body);
  const values = Object.values(req.body);

  if (!req.body.ObjSort_LfdNr || !req.body.Objekt_Template_Kennung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });

  const placeholders = keys.map(() => "?").join(",");
  const sql = `INSERT INTO SV (${keys.join(",")}) VALUES (${placeholders})`;

  db.run(sql, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID });
  });
});

// SV-Datensatz aktualisieren
app.put("/sv/:id", (req, res) => {
  const { id } = req.params;
  const updates = Object.keys(req.body).map(k => `${k} = ?`).join(", ");
  const params = [...Object.values(req.body), id];

  db.run(`UPDATE SV SET ${updates} WHERE id = ?`, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// SV-Datensatz löschen
app.delete("/sv/:id", (req, res) => {
  db.run("DELETE FROM SV WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


// --- GEWERKE API ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS gewerke (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kg INTEGER NOT NULL UNIQUE,
    kuerzel TEXT NOT NULL UNIQUE,
    bezeichnung TEXT NOT NULL,
    beschreibung TEXT
  )`);
});

/**
 * @openapi
 * /gewerke:
 *   get:
 *     summary: Liste aller Gewerke abrufen
 *     tags: [Gewerke]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neues Gewerk anlegen
 * #    tags: [Gewerke]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              kg:
 * #                type: integer
 * #                example: 410
 * #              kuerzel:
 * #                type: string
 * #                example: HZG
 * #              bezeichnung:
 * #                type: string
 * #                example: Wärmeversorgung
 * #              beschreibung:
 * #                type: string
 * #                example: Heizungsanlagen
 * #    responses:
 * #      201:
 * #        description: Gewerk erstellt
 * #
 * #/gewerke/{id}:
 * #  put:
 * #    summary: Bestehendes Gewerk aktualisieren
 * #    tags: [Gewerke]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    requestBody:
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #    responses:
 * #      200:
 * #        description: Gewerk aktualisiert
 */


app.get("/gewerke", (req, res) => {
  db.all("SELECT * FROM gewerke ORDER BY kg ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/gewerke", (req, res) => {
  const { kg, kuerzel, bezeichnung, beschreibung } = req.body;
  if (!kg || !kuerzel || !bezeichnung)
    return res.status(400).json({ error: "Pflichtfelder fehlen." });
  db.run(
    "INSERT INTO gewerke (kg, kuerzel, bezeichnung, beschreibung) VALUES (?, ?, ?, ?)",
    [kg, kuerzel, bezeichnung, beschreibung],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, kg, kuerzel, bezeichnung, beschreibung });
    }
  );
});

app.put("/gewerke/:id", (req, res) => {
  const { id } = req.params;
  const { kg, kuerzel, bezeichnung, beschreibung } = req.body;
  db.run(
    "UPDATE gewerke SET kg = ?, kuerzel = ?, bezeichnung = ?, beschreibung = ? WHERE id = ?",
    [kg, kuerzel, bezeichnung, beschreibung, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});


db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    done INTEGER DEFAULT 0
  )`);
});

app.get("/todos", (req, res) => {
  db.all("SELECT * FROM todos ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/todos", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Text erforderlich" });
  db.run("INSERT INTO todos (text, done) VALUES (?, ?)", [text, 0], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, text, done: 0 });
  });
});

app.put("/todos/:id", (req, res) => {
  const { id } = req.params;
  db.run("UPDATE todos SET done = 1 WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});


// --- ANLAGE API ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS anlage (
    kuerzel TEXT(2) NOT NULL UNIQUE,
    bezeichnung TEXT(64) NOT NULL UNIQUE,
    beschreibung TEXT(64),
    neu INTEGER DEFAULT 0
  )`);
});

/**
 * @openapi
 * /anlage:
 *   get:
 *     summary: Liste aller Anlagen abrufen
 *     tags: [Anlage]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neue Anlage anlegen
 * #    tags: [Anlage]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              kuerzel:
 * #                type: string
 * #                example: EL
 * #              bezeichnung:
 * #                type: string
 * #                example: Elektroanlage
 * #              beschreibung:
 * #                type: string
 * #                example: Stromversorgung
 * #    responses:
 * #      201:
 * #        description: Anlage erstellt
 * #
 * #/anlage/{id}:
 * #  put:
 * #    summary: Bestehende Anlage aktualisieren
 * #    tags: [Anlage]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    requestBody:
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #    responses:
 * #      200:
 * #        description: Anlage aktualisiert
 */


app.get("/anlage", (req, res) => {
  db.all("SELECT rowid as id, * FROM anlage ORDER BY kuerzel ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/anlage", (req, res) => {
  const { kuerzel, bezeichnung, beschreibung } = req.body;
  if (!kuerzel || !bezeichnung)
    return res.status(400).json({ error: "Kürzel und Bezeichnung sind Pflichtfelder." });
  db.run(
    "INSERT INTO anlage (kuerzel, bezeichnung, beschreibung, neu) VALUES (?, ?, ?, 1)",
    [kuerzel, bezeichnung, beschreibung],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, kuerzel, bezeichnung, beschreibung, neu: 1 });
    }
  );
});

app.put("/anlage/:id", (req, res) => {
  const { id } = req.params;
  const { kuerzel, bezeichnung, beschreibung, neu } = req.body;
  db.run(
    "UPDATE anlage SET kuerzel = ?, bezeichnung = ?, beschreibung = ?, neu = ? WHERE rowid = ?",
    [kuerzel, bezeichnung, beschreibung, neu, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});


// --- BAUGRUPPE API ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS baugruppe (
    kuerzel TEXT(2) NOT NULL UNIQUE,
    bezeichnung TEXT(64) NOT NULL,
    beschreibung TEXT(64),
    neu INTEGER DEFAULT 0
  )`);
});

/**
 * @openapi
 * /baugruppe:
 *   get:
 *     summary: Liste aller Baugruppen abrufen
 *     tags: [Baugruppe]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neue Baugruppe anlegen
 * #    tags: [Baugruppe]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              kuerzel:
 * #                type: string
 * #                example: BG
 * #              bezeichnung:
 * #                type: string
 * #                example: Baugruppe Beispiel
 * #              beschreibung:
 * #                type: string
 * #                example: Fassadenelemente
 * #    responses:
 * #      201:
 * #        description: Baugruppe erstellt
 * #
 * #/baugruppe/{id}:
 * #  put:
 * #    summary: Bestehende Baugruppe aktualisieren
 * #    tags: [Baugruppe]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    requestBody:
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #    responses:
 * #      200:
 * #        description: Baugruppe aktualisiert
 */


app.get("/baugruppe", (req, res) => {
  db.all("SELECT rowid as id, * FROM baugruppe ORDER BY kuerzel ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/baugruppe", (req, res) => {
  const { kuerzel, bezeichnung, beschreibung } = req.body;
  if (!kuerzel || !bezeichnung)
    return res.status(400).json({ error: "Kürzel und Bezeichnung sind Pflichtfelder." });

  db.run(
    "INSERT INTO baugruppe (kuerzel, bezeichnung, beschreibung, neu) VALUES (?, ?, ?, 1)",
    [kuerzel, bezeichnung, beschreibung],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, kuerzel, bezeichnung, beschreibung, neu: 1 });
    }
  );
});

app.put("/baugruppe/:id", (req, res) => {
  const { id } = req.params;
  const { kuerzel, bezeichnung, beschreibung, neu } = req.body;
  db.run(
    "UPDATE baugruppe SET kuerzel = ?, bezeichnung = ?, beschreibung = ?, neu = ? WHERE rowid = ?",
    [kuerzel, bezeichnung, beschreibung, neu, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});


// --- MEDIUMPOSITION API ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS mediumposition (
    kuerzel TEXT(2) NOT NULL UNIQUE,
    bezeichnung TEXT(64) NOT NULL,
    beschreibung TEXT(64),
    neu INTEGER DEFAULT 0
  )`);
});
/**
 * @openapi
 * /mediumposition:
 *   get:
 *     summary: Liste aller Medium Positionen abrufen
 *     tags: [Medium Position]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neue Medium Position anlegen
 * #    tags: [Medium Position]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              kuerzel:
 * #                type: string
 * #                example: MP
 * #              bezeichnung:
 * #                type: string
 * #                example: Medium Position Beispiel
 * #              beschreibung:
 * #                type: string
 * #                example: Wasserleitungen
 * #    responses:
 * #      201:
 * #        description: Medium Position erstellt
 * #
 * #/mediumposition/{id}:
 * #  put:
 * #    summary: Bestehende Medium Position aktualisieren
 * #    tags: [Medium Position]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    requestBody:
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              kuerzel:
 * #                type: string
 * #              bezeichnung:
 * #                type: string
 * #              beschreibung:
 * #                type: string
 * #              neu:
 * #                type: integer
 * #    responses:
 * #      200:
 * #        description: Medium Position aktualisiert
 */

app.get("/mediumposition", (req, res) => {
  db.all("SELECT rowid as id, * FROM mediumposition ORDER BY kuerzel ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/mediumposition", (req, res) => {
  const { kuerzel, bezeichnung, beschreibung } = req.body;
  if (!kuerzel || !bezeichnung)
    return res.status(400).json({ error: "Kürzel und Bezeichnung sind Pflichtfelder." });

  db.run(
    "INSERT INTO mediumposition (kuerzel, bezeichnung, beschreibung, neu) VALUES (?, ?, ?, 1)",
    [kuerzel, bezeichnung, beschreibung],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, kuerzel, bezeichnung, beschreibung, neu: 1 });
    }
  );
});

app.put("/mediumposition/:id", (req, res) => {
  const { id } = req.params;
  const { kuerzel, bezeichnung, beschreibung, neu } = req.body;
  db.run(
    "UPDATE mediumposition SET kuerzel = ?, bezeichnung = ?, beschreibung = ?, neu = ? WHERE rowid = ?",
    [kuerzel, bezeichnung, beschreibung, neu, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});


// --- AGGREGAT API ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS aggregat (
    kuerzel TEXT(2) NOT NULL UNIQUE,
    bezeichnung TEXT(64) NOT NULL,
    beschreibung TEXT(64),
    neu INTEGER DEFAULT 0
  )`);
});

/**
 * @openapi
 * /aggregat:
 *   get:
 *     summary: Liste aller Aggregate abrufen
 *     tags: [Aggregat]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neues Aggregat anlegen
 * #    tags: [Aggregat]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              kuerzel:
 * #                type: string
 * #                example: PPE
 * #              bezeichnung:
 * #                type: string
 * #                example: Aggregat Beispiel
 * #              beschreibung:
 * #                type: string
 * #                example: Pumpe
 * #    responses:
 * #      201:
 * #        description: Aggregat erstellt
 * #
 * #/aggregat/{id}:
 * #  put:
 * #    summary: Bestehendes Aggregat aktualisieren
 * #    tags: [Aggregat]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    requestBody:
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              kuerzel:
 * #                type: string
 * #              bezeichnung:
 * #                type: string
 * #              beschreibung:
 * #                type: string
 * #              neu:
 * #                type: integer
 * #    responses:
 * #      200:
 * #        description: Aggregat aktualisiert
 */


app.get("/aggregat", (req, res) => {
  db.all("SELECT rowid as id, * FROM aggregat ORDER BY kuerzel ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/aggregat", (req, res) => {
  const { kuerzel, bezeichnung, beschreibung } = req.body;
  if (!kuerzel || !bezeichnung)
    return res.status(400).json({ error: "Kürzel und Bezeichnung sind Pflichtfelder." });

  db.run(
    "INSERT INTO aggregat (kuerzel, bezeichnung, beschreibung, neu) VALUES (?, ?, ?, 1)",
    [kuerzel, bezeichnung, beschreibung],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, kuerzel, bezeichnung, beschreibung, neu: 1 });
    }
  );
});

app.put("/aggregat/:id", (req, res) => {
  const { id } = req.params;
  const { kuerzel, bezeichnung, beschreibung, neu } = req.body;
  db.run(
    "UPDATE aggregat SET kuerzel = ?, bezeichnung = ?, beschreibung = ?, neu = ? WHERE rowid = ?",
    [kuerzel, bezeichnung, beschreibung, neu, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// --- BETRIEBSMITTEL API ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS betriebsmittel (
    kuerzel TEXT(2) NOT NULL UNIQUE,
    bezeichnung TEXT(64) NOT NULL,
    beschreibung TEXT(64),
    neu INTEGER DEFAULT 0
  )`);
});

/**
 * @openapi
 * /betriebsmittel:
 *   get:
 *     summary: Liste aller Betriebsmittel abrufen
 *     tags: [Betriebsmittel]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neues Betriebsmittel anlegen
 * #    tags: [Betriebsmittel]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              kuerzel:
 * #                type: string
 * #                example: BM~
 * #              bezeichnung:
 * #                type: string
 * #                example: Betriebsmeldung 
 * #              beschreibung:
 * #                type: string
 * #                example: Betriebsmeldung
 * #    responses:
 * #      201:
 * #        description: Betriebsmittel erstellt
 * #
 * #/betriebsmittel/{id}:
 * #  put:
 * #    summary: Bestehendes Betriebsmittel aktualisieren
 * #    tags: [Betriebsmittel]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    requestBody:
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              kuerzel:
 * #                type: string
 * #              bezeichnung:
 * #                type: string
 * #              beschreibung:
 * #                type: string
 * #              neu:
 * #                type: integer
 * #    responses:
 * #      200:
 * #        description: Betriebsmittel aktualisiert
 */


app.get("/betriebsmittel", (req, res) => {
  db.all("SELECT rowid as id, * FROM betriebsmittel ORDER BY kuerzel ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/betriebsmittel", (req, res) => {
  const { kuerzel, bezeichnung, beschreibung } = req.body;
  if (!kuerzel || !bezeichnung)
    return res.status(400).json({ error: "Kürzel und Bezeichnung sind Pflichtfelder." });

  db.run(
    "INSERT INTO betriebsmittel (kuerzel, bezeichnung, beschreibung, neu) VALUES (?, ?, ?, 1)",
    [kuerzel, bezeichnung, beschreibung],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, kuerzel, bezeichnung, beschreibung, neu: 1 });
    }
  );
});

app.put("/betriebsmittel/:id", (req, res) => {
  const { id } = req.params;
  const { kuerzel, bezeichnung, beschreibung, neu } = req.body;
  db.run(
    "UPDATE betriebsmittel SET kuerzel = ?, bezeichnung = ?, beschreibung = ?, neu = ? WHERE rowid = ?",
    [kuerzel, bezeichnung, beschreibung, neu, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});


// --- FUNKTION API ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS funktion (
    kuerzel TEXT(2) NOT NULL UNIQUE,
    bezeichnung TEXT(64) NOT NULL,
    beschreibung TEXT(64),
    neu INTEGER DEFAULT 0
  )`);
});

/**
 * @openapi
 * /funktion:
 *   get:
 *     summary: Liste aller Funktionen abrufen
 *     tags: [Funktion]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neue Funktion anlegen
 * #    tags: [Funktion]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              kuerzel:
 * #                type: string
 * #                example: FU
 * #              bezeichnung:
 * #                type: string
 * #                example: Funktion Beispiel
 * #              beschreibung:
 * #                type: string
 * #                example: Steuerfunktion
 * #    responses:
 * #      201:
 * #        description: Funktion erstellt
 * #
 * #/funktion/{id}:
 * #  put:
 * #    summary: Bestehende Funktion aktualisieren
 * #    tags: [Funktion]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    responses:
 * #      200:
 * #        description: Funktion aktualisiert
 */


app.get("/funktion", (req, res) => {
  db.all("SELECT rowid as id, * FROM funktion ORDER BY kuerzel ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/funktion", (req, res) => {
  const { kuerzel, bezeichnung, beschreibung } = req.body;
  if (!kuerzel || !bezeichnung)
    return res.status(400).json({ error: "Kürzel und Bezeichnung sind Pflichtfelder." });

  db.run(
    "INSERT INTO funktion (kuerzel, bezeichnung, beschreibung, neu) VALUES (?, ?, ?, 1)",
    [kuerzel, bezeichnung, beschreibung],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, kuerzel, bezeichnung, beschreibung, neu: 1 });
    }
  );
});

app.put("/funktion/:id", (req, res) => {
  const { id } = req.params;
  const { kuerzel, bezeichnung, beschreibung, neu } = req.body;
  db.run(
    "UPDATE funktion SET kuerzel = ?, bezeichnung = ?, beschreibung = ?, neu = ? WHERE rowid = ?",
    [kuerzel, bezeichnung, beschreibung, neu, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// --- ERWEITERUNG API ---
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS erweiterung (
    kuerzel TEXT(2) NOT NULL UNIQUE,
    bezeichnung TEXT(64) NOT NULL,
    beschreibung TEXT(64),
    neu INTEGER DEFAULT 0
  )`);
});

/**
 * @openapi
 * /erweiterung:
 *   get:
 *     summary: Liste aller Erweiterungen abrufen
 *     tags: [Erweiterung]
 *     responses:
 *       200:
 *         description: Erfolgreiche Antwort mit JSON-Array
 * #  post:
 * #    summary: Neue Erweiterung anlegen
 * #    tags: [Erweiterung]
 * #    requestBody:
 * #      required: true
 * #      content:
 * #        application/json:
 * #          schema:
 * #            type: object
 * #            properties:
 * #              kuerzel:
 * #                type: string
 * #                example: EW
 * #              bezeichnung:
 * #                type: string
 * #                example: Erweiterung Beispiel
 * #              beschreibung:
 * #                type: string
 * #                example: Zusätzliche Baugruppe
 * #    responses:
 * #      201:
 * #        description: Erweiterung erstellt
 * #
 * #/erweiterung/{id}:
 * #  put:
 * #    summary: Bestehende Erweiterung aktualisieren
 * #    tags: [Erweiterung]
 * #    parameters:
 * #      - in: path
 * #        name: id
 * #        required: true
 * #        schema:
 * #          type: integer
 * #    responses:
 * #      200:
 * #        description: Erweiterung aktualisiert
 */

app.get("/erweiterung", (req, res) => {
  db.all("SELECT rowid as id, * FROM erweiterung ORDER BY kuerzel ASC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/erweiterung", (req, res) => {
  const { kuerzel, bezeichnung, beschreibung } = req.body;
  if (!kuerzel || !bezeichnung)
    return res.status(400).json({ error: "Kürzel und Bezeichnung sind Pflichtfelder." });

  db.run(
    "INSERT INTO erweiterung (kuerzel, bezeichnung, beschreibung, neu) VALUES (?, ?, ?, 1)",
    [kuerzel, bezeichnung, beschreibung],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, kuerzel, bezeichnung, beschreibung, neu: 1 });
    }
  );
});

app.put("/erweiterung/:id", (req, res) => {
  const { id } = req.params;
  const { kuerzel, bezeichnung, beschreibung, neu } = req.body;
  db.run(
    "UPDATE erweiterung SET kuerzel = ?, bezeichnung = ?, beschreibung = ?, neu = ? WHERE rowid = ?",
    [kuerzel, bezeichnung, beschreibung, neu, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// --- Erweiterung: Such-API ---
app.get("/erweiterung/search", (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === "") {
    return res.status(400).json({ error: "Bitte einen Suchbegriff angeben (Parameter ?q=...)." });
  }

  const searchTerm = `%${q}%`;
  db.all(
    `SELECT rowid as id, * FROM erweiterung 
     WHERE kuerzel LIKE ? OR bezeichnung LIKE ?
     ORDER BY kuerzel ASC`,
    [searchTerm, searchTerm],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});


// --- GLOBALE SUCH-API ---
/**
 * @openapi
 * /search:
 *   get:
 *     summary: Globale Suche über alle Tabellen (Kürzel oder Bezeichnung)
 *     tags: [Suche]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           example: heiz
 *         description: Teil des Kürzels oder der Bezeichnung
 *     responses:
 *       200:
 *         description: Liste aller Treffer mit Tabellenname
 *       400:
 *         description: Fehlender Suchbegriff
 */


app.get("/search", (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === "") {
    return res.status(400).json({ error: "Bitte einen Suchbegriff angeben (?q=...)" });
  }

  const searchTerm = `%${q}%`;

  const tables = [
    "gewerke",
    "anlage",
    "baugruppe",
    "mediumposition",
    "aggregat",
    "betriebsmittel",
    "funktion",
    "erweiterung"
  ];

  const results = [];
  let completed = 0;

  tables.forEach((table) => {
    db.all(
      `SELECT '${table}' as tabelle, rowid as id, kuerzel, bezeichnung, beschreibung
       FROM ${table}
       WHERE LOWER(kuerzel) LIKE LOWER(?) OR LOWER(bezeichnung) LIKE LOWER(?)
       ORDER BY kuerzel ASC`,
      [searchTerm, searchTerm],
      (err, rows) => {
        completed++;
        if (!err && rows.length > 0) results.push(...rows);
        if (completed === tables.length) {
          res.json(results.sort((a, b) => a.tabelle.localeCompare(b.tabelle)));
        }
      }
    );
  });
});

// --- KÜRZEL-LOOKUP-API ---

/**
 * @openapi
 * /lookup:
 *   get:
 *     summary: Suche nach einem Kürzel in allen Tabellen und gibt Beschreibung zurück
 *     tags: [Suche]
 *     parameters:
 *       - in: query
 *         name: k
 *         required: true
 *         schema:
 *           type: string
 *           example: T~~
 *         description: Kürzel, das in einer der Tabellen gesucht wird
 *     responses:
 *       200:
 *         description: Ein passender Datensatz wurde gefunden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tabelle:
 *                   type: string
 *                 kuerzel:
 *                   type: string
 *                 bezeichnung:
 *                   type: string
 *                 beschreibung:
 *                   type: string
 *       404:
 *         description: Kein Eintrag gefunden
 *       400:
 *         description: Fehlendes Kürzel
 */

app.get("/lookup", (req, res) => {
  const { k } = req.query;
  if (!k || k.trim() === "") {
    return res.status(400).json({ error: "Bitte ein Kürzel angeben (?k=...)" });
  }

  const kuerzel = k.trim().toUpperCase();

  const tables = [
    "gewerke",
    "anlage",
    "baugruppe",
    "mediumposition",
    "aggregat",
    "betriebsmittel",
    "funktion",
    "erweiterung"
  ];

  let found = null;
  let checked = 0;

  tables.forEach((table) => {
    db.get(
      `SELECT '${table}' as tabelle, kuerzel, bezeichnung, beschreibung 
       FROM ${table} WHERE UPPER(kuerzel) = ? LIMIT 1`,
      [kuerzel],
      (err, row) => {
        checked++;
        if (!err && row && !found) {
          found = row;
        }
        if (checked === tables.length) {
          if (found) {
            res.json(found);
          } else {
            res.status(404).json({ error: `Kein Eintrag mit Kürzel "${kuerzel}" gefunden.` });
          }
        }
      }
    );
  });
});

//Database Backup

/**
 * @openapi
 * /backup:
 *   get:
 *     summary: Datenbank-Datensicherung erstellen
 *     description: >
 *       Erstellt eine vollständige Kopie der SQLite-Datenbank **data.db** und speichert sie
 *       im Verzeichnis `./backups`.  
 *       Der erzeugte Dateiname enthält das aktuelle Datum und die Uhrzeit
 *       sowie die Endung `.sql`.  
 *       Beispiel: `data_2025-11-06_22-20-00.sql`
 *     tags:
 *       - Wartung
 *     responses:
 *       200:
 *         description: Backup erfolgreich erstellt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Backup erfolgreich erstellt.
 *                 file:
 *                   type: string
 *                   example: data_2025-11-06_22-20-00.sql
 *       500:
 *         description: Fehler beim Erstellen des Backups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Datei konnte nicht kopiert werden
 * /backup/zip:
 *   get:
 *     summary: Datensicherung des gesamten Projekteserstellen
 *     description: >
 *       Erstellt eine vollständige Kopie des Projektes (nicht über Swagger aufrufbar)
 *     tags:
 *       - Wartung
 */


function exportDatabaseToSQL(sourceFile, outputFile) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(sourceFile);
    let dump = "PRAGMA foreign_keys=OFF;\n\n";

    db.all(
      "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      async (err, tables) => {
        if (err) {
          db.close();
          return reject(err);
        }

        for (const table of tables) {
          dump += `DROP TABLE IF EXISTS "${table.name}";\n`;
          dump += `${table.sql};\n`;
          dump += `DELETE FROM "${table.name}";\n`;

          const rows = await new Promise((resolve2, reject2) => {
            db.all(`SELECT * FROM ${table.name}`, (err2, rows2) => {
              if (err2) reject2(err2);
              else resolve2(rows2);
            });
          });

          for (const row of rows) {
            const cols = Object.keys(row)
              .map((c) => `"${c}"`)
              .join(", ");
            const vals = Object.values(row)
              .map((v) =>
                v === null
                  ? "NULL"
                  : `'${String(v).replace(/'/g, "''")}'`
              )
              .join(", ");
            dump += `INSERT INTO "${table.name}" (${cols}) VALUES (${vals});\n`;
          }

          dump += "\n";
        }

        fs.writeFileSync(outputFile, dump, "utf8");
        db.close();
        resolve(outputFile);
      }
    );
  });
}

app.get("/backup", async (req, res) => {
  try {
    const dbName = "data";
    const sourceFile = path.join(process.cwd(), `${dbName}.db`);
    const backupDir = path.join(process.cwd(), "backups");

    if (!fs.existsSync(sourceFile)) {
      return res.status(404).json({ success: false, error: "Datenbankdatei nicht gefunden." });
    }
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);
    const backupFile = path.join(backupDir, `${dbName}_${timestamp}.sql`);

    await exportDatabaseToSQL(sourceFile, backupFile);

    // Alte Backups löschen
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => ({
        name: f,
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS);
      for (const f of toDelete) {
        fs.unlinkSync(path.join(backupDir, f.name));
        console.log(`🗑️ Altes Backup gelöscht: ${f.name}`);
      }
    }

    console.log(`✅ SQL-Backup erstellt: ${backupFile}`);
    res.download(backupFile, path.basename(backupFile));
  } catch (err) {
    console.error("❌ Backup-Fehler:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Root-Redirect auf OpenAPI ---
app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

//const PORT = process.env.PORT || 4000;
//app.listen(PORT, () => console.log(`✅ Backend läuft auf http://localhost:${PORT}`));
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Backend läuft auf http://localhost:${PORT}`);
  console.log(`🌐 Im Netzwerk erreichbar unter: http://<DEINE_IP>:${PORT}`);
});
