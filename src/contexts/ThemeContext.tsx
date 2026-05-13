import { createContext, useContext, useEffect, ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";

/**
 * Lumière ThemeContext — DLC branding.
 * If salon.has_custom_branding === true AND plan unlocks it (Elite/Master),
 * apply custom HSL colors. Otherwise force the default Deep Blue + Gold theme.
 */

type ThemeContextValue = {
  isCustomBranded: boolean;
  primary: string | null;
  accent: string | null;
  logoUrl: string | null;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Convert "#RRGGBB" to "h s% l%" string for CSS HSL var. Returns null if invalid.
const hexToHslVar = (hex: string | null): string | null => {
  if (!hex) return null;
  const m = hex.trim().match(/^#?([a-fA-F0-9]{6})$/);
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { salon, can } = usePermissions();
  const isCustomBranded = !!can.useCustomBranding && !!salon?.has_custom_branding;

  const primary = isCustomBranded ? salon?.brand_primary_color ?? null : null;
  const accent = isCustomBranded ? salon?.brand_accent_color ?? null : null;
  const logoUrl = isCustomBranded ? salon?.logo_url ?? null : null;

  useEffect(() => {
    const root = document.documentElement;
    const p = hexToHslVar(primary);
    const a = hexToHslVar(accent);
    if (isCustomBranded && p) root.style.setProperty("--primary", p);
    else root.style.removeProperty("--primary");
    if (isCustomBranded && a) {
      root.style.setProperty("--accent", a);
      root.style.setProperty("--ring", a);
    } else {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--ring");
    }
  }, [isCustomBranded, primary, accent]);

  return (
    <ThemeContext.Provider value={{ isCustomBranded, primary, accent, logoUrl }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
