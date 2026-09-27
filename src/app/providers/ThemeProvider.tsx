import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { defaultThemeId, themeStorageKey, themes } from "../../shared/theme/themes";

interface ThemeContextValue {
  themeId: string;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): string {
  try {
    const stored = localStorage.getItem(themeStorageKey);
    if (stored && themes.some((t) => t.id === stored)) return stored;
  } catch {
    // localStorage no disponible (modo privado, etc.) — usar el tema por defecto
  }
  return defaultThemeId;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>(() => readStoredTheme());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeId);
    try {
      localStorage.setItem(themeStorageKey, themeId);
    } catch {
      // no bloquea la app si no se puede guardar
    }
  }, [themeId]);

  function setThemeId(id: string) {
    setThemeIdState(id);
  }

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
