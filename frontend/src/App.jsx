import { useState, useEffect } from "react";
import Gewerke from "./pages/Gewerke.jsx";
import Anlage from "./pages/Anlage.jsx";
import Baugruppe from "./pages/Baugruppe.jsx";
import Mediumposition from "./pages/Mediumposition.jsx";
import Aggregat from "./pages/Aggregat.jsx";
import Betriebsmittel from "./pages/Betriebsmittel.jsx";
import Funktion from "./pages/Funktion.jsx";
import Erweiterung from "./pages/Erweiterung.jsx";
import Todo from "./pages/ToDo.jsx";
import GlobalSearch from "./pages/GlobalSearch.jsx";
import LookupSearch from "./pages/LookupSearch.jsx";

import AI from "./pages/AI.jsx";
import AO from "./pages/AO.jsx";
import AV from "./pages/AV.jsx";
import BI from "./pages/BI.jsx";
import BO from "./pages/BO.jsx";
import BV from "./pages/BV.jsx";
import CAL from "./pages/CAL.jsx";
import SCH from "./pages/SCH.jsx";
import EE from "./pages/EE.jsx";
import NC from "./pages/NC.jsx";
import LP from "./pages/LP.jsx";
import MI from "./pages/MI.jsx";
import MO from "./pages/MO.jsx";
import MV from "./pages/MV.jsx";
import TL from "./pages/TL.jsx";
import SV from "./pages/SV.jsx";
import DEV from "./pages/DEV.jsx";
import BackupButton from "./pages/BackupButton.jsx";


import Impressum from "./pages/Impressum.jsx";
import Lizenz from "./pages/License.jsx";
//import Backup from "./pages/Backup.jsx";


const serverUrl = `http://${import.meta.env.VITE_LOCAL_IP}:${import.meta.env.VITE_API_PORT}`;
console.log("Server:", serverUrl);

function App() {
  //const [page, setPage] = useState("todo");
  const [page, setPage] = useState("gewerke");

  const [open, setOpen] = useState({ projekte: true, system: false });
  const [mobileMenu, setMobileMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Fenstergröße beobachten → responsive Verhalten
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSection = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const changePage = (newPage) => {
    setPage(newPage);
    if (isMobile) setMobileMenu(false); // Menü nach Auswahl schließen
  };

  return (
    <div>
      <GlobalSearch />
      <LookupSearch />
        <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          minHeight: "100vh",
          background: "#f8f9fa",
        }}
      >
        {/* MOBILE HEADER */}
        {isMobile && (
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.8rem 1rem",
              background: "#ffffff",
              borderBottom: "1px solid #e5e7eb",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>📋 BACtwin </h2>
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              style={{
                fontSize: "1.3rem",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {mobileMenu ? "✖" : "☰"}
            </button>
          </header>
        )}

        {/* SEITENLEISTE (Akkordeon) */}
        {(mobileMenu || !isMobile) && (
          <aside
            style={{
              width: isMobile ? "100%" : "260px",
              background: "#fff",
              borderRight: isMobile ? "none" : "1px solid #e5e7eb",
              borderBottom: isMobile ? "1px solid #e5e7eb" : "none",
              padding: "1rem",
              boxShadow: isMobile
                ? "0 2px 6px rgba(0,0,0,0.05)"
                : "2px 0 6px rgba(0,0,0,0.05)",
            }}
          >
            <h2
              style={{
                fontSize: "1.2rem",
                marginBottom: "1rem",
                textAlign: isMobile ? "center" : "left",
              }}
            >
              📋 Navigation
            </h2>

            {/* Akkordeon: BAS */}
            <div>
              <button
                onClick={() => toggleSection("projekte")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "none",
                  border: "none",
                  fontSize: "1rem",
                  cursor: "pointer",
                  padding: "8px 0",
                }}
              >
                <span>🛢️ BAS Datenbank</span>
                <span>{open.projekte ? "▾" : "▸"}</span>
              </button>

              {open.projekte && (
                <div
                  style={{
                    marginLeft: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <button
                    onClick={() => changePage("gewerke")}
                    style={{
                      background: page === "gewerke" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🏗️ Gewerke
                  </button>
                  <button
                    onClick={() => changePage("anlage")}
                    style={{
                      background: page === "anlage" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🛢️ Anlagen
                  </button>

                  <button
                    onClick={() => changePage("baugruppe")}
                    style={{
                      background: page === "baugruppe" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🧩 Baugruppen
                  </button>

                  <button
                    onClick={() => changePage("mediumposition")}
                    style={{
                      background: page === "mediumposition" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    💧 Medium|Positionen
                  </button>

                  <button
                    onClick={() => changePage("aggregat")}
                    style={{
                      background: page === "aggregat" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    ⚙️ Aggregate
                  </button>

                  <button
                    onClick={() => changePage("betriebsmittel")}
                    style={{
                      background: page === "betriebsmittel" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🔧 Betriebsmittel
                  </button>

                  <button
                    onClick={() => changePage("funktion")}
                    style={{
                      background: page === "funktion" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    ⚡ Funktionen
                  </button>

                  <button
                    onClick={() => changePage("erweiterung")}
                    style={{
                      background: page === "erweiterung" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🔗 Erweiterungen
                  </button>

                  <button
                    onClick={() => changePage("todo")}
                    style={{
                      background: page === "todo" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    📝 To-Do Liste
                  </button>
                </div>
              )}
            </div>

            {/* Akkordeon: Objekte */}
            <div>
              <button
                onClick={() => toggleSection("objekte")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "none",
                  border: "none",
                  fontSize: "1rem",
                  cursor: "pointer",
                  padding: "8px 0",
                }}
              >
                <span>🛢️ Objekt Datenbank</span>
                <span>{open.objekte ? "▾" : "▸"}</span>
              </button>

              {open.objekte && (
                <div
                  style={{
                    marginLeft: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >

                  <button
                    onClick={() => changePage("ai")}
                    style={{
                      background: page === "ai" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🌡️ AI Templates
                  </button> 
                  <button
                    onClick={() => changePage("ao")}
                    style={{
                      background: page === "ao" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🎚️ AO Templates
                  </button> 
                  <button
                    onClick={() => changePage("av")}
                    style={{
                      background: page === "av" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🔢 AV Templates
                  </button>
                  <button
                    onClick={() => changePage("bi")}
                    style={{
                      background: page === "bi" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    ⏻ BI Templates
                  </button>
                  <button
                    onClick={() => changePage("bo")}
                    style={{
                      background: page === "bo" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    💡 BO Templates
                  </button> 
                  <button
                    onClick={() => changePage("bv")}
                    style={{
                      background: page === "bv" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    ⚙️ BV Templates
                  </button>
                  <button
                    onClick={() => changePage("cal")}
                    style={{
                      background: page === "cal" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    📅 CAL Templates
                  </button> 
                  <button
                    onClick={() => changePage("sch")}
                    style={{
                      background: page === "sch" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🕒 SCH Templates
                  </button> 
                  <button
                    onClick={() => changePage("ee")}
                    style={{
                      background: page === "ee" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    ⚠️ EE Templates
                  </button> 
                  <button
                    onClick={() => changePage("nc")}
                    style={{
                      background: page === "nc" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🔔 NC Templates
                  </button>
                  <button
                    onClick={() => changePage("mi")}
                    style={{
                      background: page === "mi" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🧩 MI Templates
                  </button>
                  <button
                    onClick={() => changePage("mo")}
                    style={{
                      background: page === "mo" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🎛️ MO Templates
                  </button>
                  <button
                    onClick={() => changePage("mv")}
                    style={{
                      background: page === "mv" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🧮 MV Templates
                  </button>
                  <button
                    onClick={() => changePage("tl")}
                    style={{
                      background: page === "tl" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    📈 TL Templates
                  </button> 
                  <button
                    onClick={() => changePage("sv")}
                    style={{
                      background: page === "sv" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🗂️ SV Templates
                  </button>                   
                  <button
                    onClick={() => changePage("lp")}
                    style={{
                      background: page === "lp" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🔁 LP Templates
                  </button>
                  <button
                    onClick={() => changePage("dev")}
                    style={{
                      background: page === "dev" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🖧 DEV Templates
                  </button>      

                  
                  
                </div>
              )}
            </div>

            

            {/* Akkordeon: BAS Generator */}
            <div style={{ marginTop: "1rem" }}>
              <button
                onClick={() => toggleSection("system")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "none",
                  border: "none",
                  fontSize: "1rem",
                  cursor: "pointer",
                  padding: "8px 0",
                }}
              >
                <span>⚙️ BAS Generator</span>
                <span>{open.system ? "▾" : "▸"}</span>
              </button>
              {open.system && (
                <div style={{ marginLeft: "1rem", color: "#888" }}>
                  <p style={{ fontSize: "0.9rem" }}>Hier soll mal der BAS Generator stehen…</p>
                </div>
              )}
            </div>

            {/* Akkordeon: Wartung */}
            <div>
              <button
                onClick={() => toggleSection("wartung")}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  background: "none",
                  border: "none",
                  fontSize: "1rem",
                  cursor: "pointer",
                  padding: "8px 0",
                }}
              >
                <span>🛢️ Datenbankwartung</span>
                <span>{open.wartung ? "▾" : "▸"}</span>
              </button>

              {open.wartung && (
                <div
                  style={{
                    marginLeft: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <button
                    onClick={() => changePage("backup")}
                    style={{
                      background: page === "backup" ? "#e0f2fe" : "transparent",
                      border: "none",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    🛢️ Backup
                  </button>
                  
                </div>
              )}
            </div>

            

          <button
            onClick={() => changePage("impressum")}
            style={{
              background: page === "impressum" ? "#e0f2fe" : "transparent",
              border: "none",
              textAlign: "left",
              padding: "6px 8px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            ⚖️ Impressum & Datenschutz
          </button>
          <button
            onClick={() => changePage("license")}
            style={{
              background: page === "license" ? "#e0f2fe" : "transparent",
              border: "none",
              textAlign: "left",
              padding: "6px 8px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            ⚖️ Lizenz
          </button>


          </aside>
        )}

        {/* HAUPTINHALT */}
        <main
          style={{
            flex: 1,
            padding: "1rem",
            overflowX: "auto",
          }}
        >
          {page === "gewerke" && <Gewerke />}
          {page === "anlage" && <Anlage />}
          {page === "baugruppe" && <Baugruppe />}
          {page === "mediumposition" && <Mediumposition />}
          {page === "aggregat" && <Aggregat />}
          {page === "betriebsmittel" && <Betriebsmittel />}
          {page === "funktion" && <Funktion />}
          {page === "erweiterung" && <Erweiterung />}
          {page === "todo" && <Todo />}
          {page === "ai" && <AI />} 
          {page === "ao" && <AO />} 
          {page === "av" && <AV />}
          {page === "bi" && <BI />}
          {page === "bo" && <BO />}          
          {page === "bv" && <BV />}  
          {page === "mi" && <MI />}  
          {page === "mo" && <MO />}            
          {page === "mv" && <MV />}          
          {page === "cal" && <CAL />}          
          {page === "sch" && <SCH />}
          {page === "ee" && <EE />}
          {page === "nc" && <NC />}
          {page === "tl" && <TL />} 
          {page === "sv" && <SV />}
          {page === "lp" && <LP />}
          {page === "dev" &&  <DEV />}  
          {page === "backup" && <BackupButton />}          
          {page === "impressum" && <Impressum />}
          {page === "license" && <Lizenz />}          
        </main>
      </div>
    </div>
    
  );
}


export default App;
