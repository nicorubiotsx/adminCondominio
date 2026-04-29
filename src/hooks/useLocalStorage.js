'use client';

import { useState, useEffect } from 'react';

// Hook genérico para usar localStorage de forma segura en Next.js
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      setValue(stored !== null ? JSON.parse(stored) : defaultValue);
    } catch {
      setValue(defaultValue);
    }
    setLoaded(true);
  }, [key]);

  const setStored = (newValue) => {
    try {
      const toStore = typeof newValue === 'function' ? newValue(value) : newValue;
      window.localStorage.setItem(key, JSON.stringify(toStore));
      setValue(toStore);
    } catch {}
  };

  return [value, setStored, loaded];
}

// Hook para historial de búsqueda (últimas 5)
export function useSearchHistory(storageKey) {
  const [history, setHistory] = useLocalStorage(storageKey, []);

  const addSearch = (term) => {
    if (!term || term.trim().length < 2) return;
    setHistory(prev => {
      const filtered = prev.filter(h => h !== term.trim());
      return [term.trim(), ...filtered].slice(0, 5);
    });
  };

  const clearHistory = () => setHistory([]);

  return { history, addSearch, clearHistory };
}

// Hook para guardar el último departamento consultado
export function useLastDepartamento() {
  const [last, setLast] = useLocalStorage('last_departamento', null);

  const save = (id, numero) => setLast({ id, numero, at: new Date().toISOString() });
  const clear = () => setLast(null);

  return { last, save, clear };
}

// Hook para modo oscuro (el app ya es oscuro, este permite modo CLARO)
export function useDarkMode() {
  const [isDark, setIsDark] = useLocalStorage('theme_dark', true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = () => setIsDark(prev => !prev);

  return { isDark, toggle };
}
