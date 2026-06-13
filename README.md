# BACtwin Helper

Vite + React Frontend und Express + SQLite Backend zur maschinellen Darstellung der BACtwin BAS und Object-Templates sowie der BACtwin Profile. 

Hintergrundinformation sind unter https://www.amev-online.de/AMEVInhalt/Planen/Gebaeudeautomation/BACtwin/ zu finden. 

## Installation (Lokal)

Dieses System wurde auf einem virtuellen Lubuntu Server erstellt und getestet und basiert auf nodejs und npm. Diese müssen installiert sein.

### Backend starten
```bash
cd backend

npm install 

# Optional: Datenbank mit Beispieldaten nur zum Testen gefüllen 
sqlite3 data.db < demo-utils/example_data.sql

npm start
```

-> Läuft auf http://localhost:4000

### Frontend starten
```bash
cd frontend
npm install
npm run dev
```
-> Läuft auf http://localhost:5173

## Ereichbarkeit Frontend
Kann unter vite.config.js eingestellt werden. Außerhalb der Verwedung in localhost müssen im server.js ebenfalls die servers angepasst werden.

Fehler bitte als issues melden.
