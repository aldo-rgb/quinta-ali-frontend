'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchAPI } from '@/lib/api';

interface ThemeColors {
  color_primary: string;
  color_primary_light: string;
  color_primary_dark: string;
  color_accent: string;
  color_accent_light: string;
  color_background: string;
  color_foreground: string;
}

const DEFAULT_COLORS: ThemeColors = {
  color_primary: '#0d9488',
  color_primary_light: '#5eead4',
  color_primary_dark: '#0f766e',
  color_accent: '#d4a853',
  color_accent_light: '#f0deb4',
  color_background: '#f8fafb',
  color_foreground: '#1a2e35',
};

const CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
  color_primary: '--primary',
  color_primary_light: '--primary-light',
  color_primary_dark: '--primary-dark',
  color_accent: '--accent',
  color_accent_light: '--accent-light',
  color_background: '--background',
  color_foreground: '--foreground',
};

interface ThemeContextType {
  colors: ThemeColors;
  updateColors: (newColors: Partial<ThemeColors>) => Promise<void>;
  saving: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: DEFAULT_COLORS,
  updateColors: async () => {},
  saving: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyColors(colors: ThemeColors) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    const value = colors[key as keyof ThemeColors];
    if (value) root.style.setProperty(cssVar, value);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Cargar colores guardados (primero localStorage para render rápido, luego API)
    const cached = localStorage.getItem('theme_colors');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setColors(parsed);
        applyColors(parsed);
      } catch { /* ignore */ }
    }

    fetchAPI('/api/config')
      .then((config) => {
        const merged = { ...DEFAULT_COLORS };
        for (const key of Object.keys(DEFAULT_COLORS)) {
          if (config[key]) merged[key as keyof ThemeColors] = config[key];
        }
        setColors(merged);
        applyColors(merged);
        localStorage.setItem('theme_colors', JSON.stringify(merged));
      })
      .catch(() => {
        // Si falla la API, usar defaults o cache
      });
  }, []);

  const updateColors = useCallback(async (newColors: Partial<ThemeColors>) => {
    const merged = { ...colors, ...newColors };
    setColors(merged);
    applyColors(merged);
    localStorage.setItem('theme_colors', JSON.stringify(merged));

    setSaving(true);
    try {
      await fetchAPI('/api/config', {
        method: 'PUT',
        body: JSON.stringify(newColors),
      });
    } finally {
      setSaving(false);
    }
  }, [colors]);

  return (
    <ThemeContext.Provider value={{ colors, updateColors, saving }}>
      {children}
    </ThemeContext.Provider>
  );
}
