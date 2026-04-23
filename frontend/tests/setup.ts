import "@testing-library/jest-dom";
import { afterEach, beforeAll, vi } from "vitest";

beforeAll(() => {
  function makeStorageMock(): Storage {
    const store: Record<string, string> = {};
    return {
      length: 0,
      key: (index: number) => Object.keys(store)[index] ?? null,
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = String(value); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    };
  }

  Object.defineProperty(window, "localStorage", {
    value: makeStorageMock(),
    writable: true,
  });

  Object.defineProperty(window, "sessionStorage", {
    value: makeStorageMock(),
    writable: true,
  });
});

afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.restoreAllMocks();
});