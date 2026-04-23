import { useSearchParams, URLSearchParamsInit } from "react-router-dom";
import { useCallback } from "react";

type FilterKeys = "q" | "waste_type" | "open_now" | "sort_by" | "sort_dir" | "limit" | "page";

type Filters = Record<FilterKeys, string>;

type SetSearchParams = ReturnType<typeof useSearchParams>[1];

const DEFAULTS: Filters = {
  q: "",
  waste_type: "",
  open_now: "",
  sort_by: "",
  sort_dir: "asc",
  limit: "10",
  page: "1",
};

type PartialFilters = Partial<Filters>;

export function useFilterState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: Filters = Object.fromEntries(
    (Object.keys(DEFAULTS) as FilterKeys[]).map((key) => [
      key,
      searchParams.get(key) ?? DEFAULTS[key],
    ])
  ) as Filters;

  const setFilters = useCallback(
    (next: PartialFilters) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          Object.entries(next).forEach(([k, v]) => {
            const key = k as FilterKeys;
            if (v === undefined || v === null) return;
            if (v === "" || v === DEFAULTS[key]) {
              p.delete(key);
            } else {
              p.set(key, String(v));
            }
          });
          return p;
        },
        { replace: true } as { replace?: boolean }
      );
    },
    [setSearchParams]
  );

  const reset = useCallback(() => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      (Object.keys(DEFAULTS) as FilterKeys[]).forEach((k) => p.delete(k));
      return p;
    }, { replace: true } as { replace?: boolean });
  }, [setSearchParams]);

  return { filters, setFilters, reset, setSearchParams  } as {
    filters: Filters;
    setFilters: (next: PartialFilters) => void;
    reset: () => void;
    setSearchParams: SetSearchParams;
  };
}
