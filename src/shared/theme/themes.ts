export interface ThemeOption {
  id: string;
  label: string;
  swatch: string; // color representativo, solo para el selector visual
}

export const themes: ThemeOption[] = [
  { id: "petroleo", label: "Petróleo", swatch: "#163a33" },
  { id: "indigo", label: "Índigo", swatch: "#3d3583" },
  { id: "vino", label: "Vino", swatch: "#5c1a33" },
  { id: "nocturno", label: "Nocturno", swatch: "#4fae94" },
];

export const defaultThemeId = "petroleo";
export const themeStorageKey = "academia-virtual-theme";
