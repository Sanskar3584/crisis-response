import { useEffect, useState } from "react";
import Login from "./Login";
import Board from "./Board";

type Theme = "light" | "dark";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [theme, setTheme] = useState<Theme>(
      (localStorage.getItem("theme") as Theme) || "light"
  );

  // Apply the theme to <html> and remember it.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  if (!token) {
    return <Login onLogin={(t) => setToken(t)} theme={theme} onToggleTheme={toggleTheme} />;
  }
  return <Board onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />;
}