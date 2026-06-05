import React, { createContext, useState, useMemo, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const ThemeContext = createContext();

// ── Color Themes ────────────────────────────────────────────────────────────
export const colorThemes = {
  default: {
    label: 'Mint (Default)',
    light: {
      primary: '#52B788', secondary: '#E07A5F',
      background: '#F7F7F2', paper: '#FFFFFF',
      divider: 'rgba(82, 183, 136, 0.14)',
    },
    dark: {
      primary: '#4ECBA2', secondary: '#F07B62',
      background: '#111916', paper: '#192220',
      divider: 'rgba(78, 203, 162, 0.12)',
    }
  },
  ocean: {
    label: 'Ocean Teal',
    light: {
      primary: '#028090', secondary: '#00A896',
      background: '#F0F8FF', paper: '#FFFFFF',
      divider: 'rgba(2, 128, 144, 0.14)',
    },
    dark: {
      primary: '#00A896', secondary: '#028090',
      background: '#0B1518', paper: '#14252B',
      divider: 'rgba(0, 168, 150, 0.12)',
    }
  },
  sunset: {
    label: 'Warm Sunset',
    light: {
      primary: '#E07A5F', secondary: '#F4A261',
      background: '#FFF5F0', paper: '#FFFFFF',
      divider: 'rgba(224, 122, 95, 0.14)',
    },
    dark: {
      primary: '#E76F51', secondary: '#F4A261',
      background: '#1F1412', paper: '#2B1A17',
      divider: 'rgba(231, 111, 81, 0.12)',
    }
  },
  lavender: {
    label: 'Soft Lavender',
    light: {
      primary: '#8B5FBF', secondary: '#D6CADD',
      background: '#F9F5FF', paper: '#FFFFFF',
      divider: 'rgba(139, 95, 191, 0.14)',
    },
    dark: {
      primary: '#A584D2', secondary: '#D6CADD',
      background: '#1A1625', paper: '#241E30',
      divider: 'rgba(165, 132, 210, 0.12)',
    }
  },
  minimal: {
    label: 'Monochrome',
    light: {
      primary: '#4A4A4A', secondary: '#9B9B9B',
      background: '#F9F9F9', paper: '#FFFFFF',
      divider: 'rgba(74, 74, 74, 0.14)',
    },
    dark: {
      primary: '#D4D4D4', secondary: '#9B9B9B',
      background: '#121212', paper: '#1E1E1E',
      divider: 'rgba(212, 212, 212, 0.12)',
    }
  }
};

function hexToRgb(hex) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `${r}, ${g}, ${b}`;
}

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('appMode') || 'light');
  const [colorTheme, setColorTheme] = useState(() => localStorage.getItem('appColorTheme') || 'default');

  useEffect(() => {
    localStorage.setItem('appMode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('appColorTheme', colorTheme);
  }, [colorTheme]);

  const toggleTheme = () =>
    setMode(prev => (prev === 'light' ? 'dark' : 'light'));

  const theme = useMemo(
    () => {
      const isDark = mode === 'dark';
      const palette = colorThemes[colorTheme] ? colorThemes[colorTheme][isDark ? 'dark' : 'light'] : colorThemes['default'][isDark ? 'dark' : 'light'];
      const rgbPrimary = hexToRgb(palette.primary);
      
      return createTheme({
        typography: {
          fontFamily: "'Inter', 'GoogleSans-Regular', sans-serif",
          h6: { fontWeight: 600, letterSpacing: '-0.01em' },
          body2: { fontSize: '0.8rem' },
        },
        shape: { borderRadius: 10 },
        palette: {
          mode,
          primary: { main: palette.primary, contrastText: isDark ? '#111' : '#fff' },
          secondary: { main: palette.secondary, contrastText: '#fff' },
          background: { default: palette.background, paper: palette.paper },
          text: isDark 
            ? { primary: '#E2EDE8', secondary: '#9AA8A2' }
            : { primary: '#2C3830', secondary: '#6A7C72' },
          divider: palette.divider,
          action: { 
            hover: `rgba(${rgbPrimary}, 0.08)`, 
            selected: `rgba(${rgbPrimary}, 0.14)` 
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 8,
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              },
              containedPrimary: {
                boxShadow: `0 3px 12px rgba(${rgbPrimary},0.28)`,
                '&:hover': {
                  boxShadow: `0 5px 18px rgba(${rgbPrimary},0.42)`,
                  transform: 'translateY(-1px)',
                },
              },
            },
          },
          MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
          MuiIconButton: { styleOverrides: { root: { borderRadius: 8, transition: 'all 0.18s ease' } } },
          MuiListItem: { styleOverrides: { root: { borderRadius: 8, transition: 'all 0.12s ease' } } },
        },
      });
    },
    [mode, colorTheme],
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, colorTheme, setColorTheme, colorThemes }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};