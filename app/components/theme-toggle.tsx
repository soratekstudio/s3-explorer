import { Moon, Sun } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Read actual DOM state as source of truth
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggle = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const next = isDark ? "light" : "dark";
    document.documentElement.classList.remove("dark", "light");
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    }
    document.cookie = `theme=${next};path=/;max-age=31536000`;
    setTheme(next);
  };

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
