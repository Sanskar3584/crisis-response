import { useState } from "react";
import Login from "./Login";
import Board from "./Board";

export default function App() {
  // Start logged-in if a token is already saved.
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  if (!token) {
    return <Login onLogin={(t) => setToken(t)} />;
  }
  return <Board onLogout={handleLogout} />;
}