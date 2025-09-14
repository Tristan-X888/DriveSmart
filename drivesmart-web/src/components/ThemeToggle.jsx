import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

/**
 * Simple light/dark toggle.
 * - Click to switch between light and dark.
 * - Uses ThemeProvider (src/lib/theme.js) to apply/remove the `.dark` class.
 */
export default function ThemeToggle({ className = "" }) {
  const { resolvedTheme, toggle } = useTheme(); // "light" | "dark"

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`h-9 w-9 ${className}`}
    >
      {/* Sun shown in light, Moon in dark */}
      <Sun className={`h-4 w-4 ${isDark ? "hidden" : ""}`} />
      <Moon className={`h-4 w-4 ${isDark ? "" : "hidden"}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
