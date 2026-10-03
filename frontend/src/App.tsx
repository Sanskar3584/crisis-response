import { useEffect, useState } from "react";
import Login from "./Login";
import Board from "./Board";

type Theme = "light" | "dark";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [theme, setTheme] = useState<Theme>((localStorage.getItem("theme") as Theme) || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={setToken} theme={theme} onToggleTheme={toggleTheme} />;
  }
  return <Board onLogout={logout} theme={theme} onToggleTheme={toggleTheme} />;
}
