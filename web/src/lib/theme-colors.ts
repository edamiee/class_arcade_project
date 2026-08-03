// Same three palettes as the original single-file app's [data-theme] CSS
// variables (index.html), ported to a plain object since the web app styles
// with Tailwind rather than a global stylesheet with CSS custom properties.
export interface ThemeColors {
  bg: string;
  panel: string;
  panelEdge: string;
  yellow: string;
  pink: string;
  cyan: string;
  red: string;
  green: string;
  text: string;
  muted: string;
}

export const THEME_COLORS: Record<string, ThemeColors> = {
  pac: {
    bg: "#060613",
    panel: "#10102a",
    panelEdge: "#2a2a5c",
    yellow: "#ffd400",
    pink: "#ff5cb3",
    cyan: "#40e0ff",
    red: "#ff3b3b",
    green: "#33ff8c",
    text: "#eef0ff",
    muted: "#8888b0",
  },
  blocks: {
    bg: "#07090c",
    panel: "#10151c",
    panelEdge: "#2f3a45",
    yellow: "#ffe14d",
    pink: "#ff8c1a",
    cyan: "#4de3ff",
    red: "#ff4d4d",
    green: "#4dffa0",
    text: "#eaf2ff",
    muted: "#7f8ab0",
  },
  plumber: {
    bg: "#170a0a",
    panel: "#2a1414",
    panelEdge: "#5a2a2a",
    yellow: "#ffcc33",
    pink: "#ff6b6b",
    cyan: "#4a90d9",
    red: "#e63946",
    green: "#4caf50",
    text: "#fff3e0",
    muted: "#b0968a",
  },
};

export function themeColors(theme: string): ThemeColors {
  return THEME_COLORS[theme] ?? THEME_COLORS.pac;
}
