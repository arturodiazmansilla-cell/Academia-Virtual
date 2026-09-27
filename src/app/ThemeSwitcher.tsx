import { themes } from "../shared/theme/themes";
import { useTheme } from "./providers/ThemeProvider";

export function ThemeSwitcher() {
  const { themeId, setThemeId } = useTheme();

  return (
    <div className="theme-switcher">
      <span className="theme-switcher-label">Tema</span>
      <div className="theme-swatches">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`theme-swatch ${themeId === theme.id ? "active" : ""}`}
            style={{ backgroundColor: theme.swatch }}
            title={theme.label}
            aria-label={`Usar tema ${theme.label}`}
            aria-pressed={themeId === theme.id}
            onClick={() => setThemeId(theme.id)}
          />
        ))}
      </div>
    </div>
  );
}
