import { createContext, useContext, useEffect, useState } from 'react';
import { applyPreset, applyMode, nextPreset, nextMode } from '../theme/theme-switch';

const ThemeContext = createContext(null);
const PRESET_KEY = 'lms-preset';
const MODE_KEY = 'lms-mode';

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing / storage disabled — preference just won't persist across reloads.
  }
}

export function ThemeProvider({ children }) {
  const [preset, setPreset] = useState(() => readStored(PRESET_KEY, 'harbour'));
  const [mode, setMode] = useState(() => readStored(MODE_KEY, 'system'));

  useEffect(() => {
    applyPreset(preset);
    writeStored(PRESET_KEY, preset);
  }, [preset]);

  useEffect(() => {
    applyMode(mode);
    writeStored(MODE_KEY, mode);
  }, [mode]);

  const cyclePreset = () => setPreset((p) => nextPreset(p));
  const cycleMode = () => setMode((m) => nextMode(m));

  return (
    <ThemeContext.Provider value={{ preset, mode, cyclePreset, cycleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
