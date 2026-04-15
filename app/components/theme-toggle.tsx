import { Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useCallback, useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const match = document.cookie.match(/theme=(light|dark)/);
    setTheme(match ? (match[1] as "light" | "dark") : "dark");
  }, []);

  const toggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.cookie = `theme=${next};path=/;max-age=31536000`;
    document.documentElement.classList.toggle("dark", next === "dark");
  }, [theme]);

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
