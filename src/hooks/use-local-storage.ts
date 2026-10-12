"use client";

import { useState, useEffect, useMemo } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Memoize initialValue to prevent it from being re-created on every render.
  const initialValueMemo = useMemo(() => initialValue, []);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        window.localStorage.setItem(key, JSON.stringify(initialValueMemo));
        setStoredValue(initialValueMemo);
      }
    } catch (error) {
      console.log(error);
      setStoredValue(initialValueMemo);
    }
  }, [key, initialValueMemo]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = typeof value === 'function' ? (value as (val: T) => T)(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}
