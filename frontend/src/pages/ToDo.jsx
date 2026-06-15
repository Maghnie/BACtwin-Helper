import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from '../config';


function Todo() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

  // Beim Laden der Seite Todos abrufen
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await axios.get(`${API_URL}/todos`);
      setTodos(res.data);
    } catch (err) {
      console.error("Fehler beim Laden:", err);
    }
  };

  const addTodo = async () => {
    if (!text.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/todos`, { text });
      setTodos([res.data, ...todos]);
      setText("");
    } catch (err) {
      console.error("Fehler beim Erstellen:", err);
    }
  };

  const markDone = async (id) => {
    try {
      await axios.put(`${API_URL}/todos/${id}`);
      setTodos(todos.map((t) => (t.id === id ? { ...t, done: 1 } : t)));
    } catch (err) {
      console.error("Fehler beim Aktualisieren:", err);
    }
  };

  return (
    <div>
      <h1>📝 To-Do Liste</h1>

      {/* Eingabefeld und Hinzufügen-Button */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Neues Todo..."
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button onClick={addTodo}>Hinzufügen</button>
      </div>

      {/* Liste der Todos */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span
              style={
                todo.done ? { textDecoration: "line-through", color: "#999" } : {}
              }
            >
              {todo.text}
            </span>
            {!todo.done && <button onClick={() => markDone(todo.id)}>✅</button>}
          </li>
        ))}
        {todos.length === 0 && (
          <li style={{ color: "#666" }}>Keine Einträge.</li>
        )}
      </ul>
    </div>
  );
}

export default Todo;
