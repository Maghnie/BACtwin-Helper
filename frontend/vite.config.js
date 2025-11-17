import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    //host: "0.0.0.0", // erlaubt Verbindungen von anderen Geräten im Netzwerk
    //host: "amevbactwin.local", // oder "192.168.0.42"
    host: "192.168.0.178", // oder "192.168.0.42"
    port: 5173,       // optional: Port festlegen    
    allowedHosts: ["amevbacnet"] // <— hier dein Hostname eintragen
  }
})


