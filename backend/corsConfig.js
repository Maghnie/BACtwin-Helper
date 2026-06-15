export const corsOptions = {
  origin: [
    'https://maghnie.github.io',    // Location of frontend demo on GitHub Pages
    'http://localhost:5173',        // Vite dev server
    'http://127.0.0.1:5173',
    'http://192.168.0.178:5173'    // Your dev IP
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};