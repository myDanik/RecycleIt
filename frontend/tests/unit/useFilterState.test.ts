import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";
import { useFilterState } from "../../src/hooks/useFilterState";

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(MemoryRouter, { initialEntries: ["/"] }, children);

describe("useFilterState — начальные значения", () => {
  it("возвращает дефолтные значения при пустых searchParams", () => {
    const { result } = renderHook(() => useFilterState(), { wrapper });

    expect(result.current.filters.q).toBe("");
    expect(result.current.filters.waste_type).toBe("");
    expect(result.current.filters.open_now).toBe("");
    expect(result.current.filters.sort_dir).toBe("asc");
    expect(result.current.filters.limit).toBe("10");
    expect(result.current.filters.page).toBe("1");
  });
});

describe("useFilterState.setFilters", () => {
  it("устанавливает значение фильтра q", async () => {
    const { result } = renderHook(() => useFilterState(), { wrapper });

    act(() => {
      result.current.setFilters({ q: "стекло" });
    });

    await waitFor(() => {
      expect(result.current.filters.q).toBe("стекло");
    });
  });

  it("устанавливает несколько фильтров одновременно", async () => {
    const { result } = renderHook(() => useFilterState(), { wrapper });

    act(() => {
      result.current.setFilters({
        q: "пластик",
        waste_type: "plastic",
        limit: "20",
      });
    });

    await waitFor(() => {
      expect(result.current.filters.q).toBe("пластик");
      expect(result.current.filters.waste_type).toBe("plastic");
      expect(result.current.filters.limit).toBe("20");
    });
  });

  it("удаляет параметр при пустом значении", async () => {
    const { result } = renderHook(() => useFilterState(), { wrapper });

    act(() => {
      result.current.setFilters({ q: "стекло" });
    });

    act(() => {
      result.current.setFilters({ q: "" });
    });

    await waitFor(() => {
      expect(result.current.filters.q).toBe("");
    });
  });
});

describe("useFilterState.reset", () => {
  it("сбрасывает все фильтры к дефолтным значениям", async () => {
    const { result } = renderHook(() => useFilterState(), { wrapper });

    act(() => {
      result.current.setFilters({
        q: "тест",
        waste_type: "plastic",
        page: "3",
      });
    });

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.filters.q).toBe("");
      expect(result.current.filters.waste_type).toBe("");
      expect(result.current.filters.page).toBe("1");
    });
  });
});

describe("useFilterState — пагинация", () => {
  it("устанавливает страницу и лимит", async () => {
    const { result } = renderHook(() => useFilterState(), { wrapper });

    act(() => {
      result.current.setFilters({ page: "2", limit: "25" });
    });

    await waitFor(() => {
      expect(result.current.filters.page).toBe("2");
      expect(result.current.filters.limit).toBe("25");
    });
  });
});

describe("useFilterState — сортировка", () => {
  it("устанавливает sort_by и sort_dir", async () => {
    const { result } = renderHook(() => useFilterState(), { wrapper });

    act(() => {
      result.current.setFilters({
        sort_by: "name",
        sort_dir: "desc",
      });
    });

    await waitFor(() => {
      expect(result.current.filters.sort_by).toBe("name");
      expect(result.current.filters.sort_dir).toBe("desc");
    });
  });
});