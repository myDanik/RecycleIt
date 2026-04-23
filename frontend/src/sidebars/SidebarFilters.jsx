import React from "react";
import { useNavigate } from "react-router-dom";
import SidebarShell from "../shared/SidebarShell";
import { useFilterState } from "../hooks/useFilterState";

const WASTE_TYPES = [
  { label: "Стекло",      value: "glass" },
  { label: "Пластик",     value: "plastic" },
  { label: "Металл",      value: "metal" },
  { label: "Бумага",      value: "paper" },
  { label: "Электроника", value: "electronics" },
];

export default function SidebarFilters() {
  const navigate = useNavigate();
  const { filters, reset, setSearchParams } = useFilterState();

  const [draft, setDraft] = React.useState(filters);

  const filtersKey = JSON.stringify(filters);
  React.useEffect(() => {
    setDraft(filters);
  }, [filtersKey]);

const apply = () => {
  const params = new URLSearchParams();
  Object.entries(draft).forEach(([k, v]) => {
    if (v !== "" && v != null) params.set(k, String(v));
  });
  setSearchParams(params, { replace: true });

  navigate({ pathname: "/sidebar/main", search: params.toString() });
};

  const handleReset = () => {
    reset();
    setDraft({
      q: "", waste_type: "", open_now: "",
      sort_by: "", sort_dir: "asc", limit: "10", page: "1",
    });
  };

  return (
    <SidebarShell title="Фильтры">
      <div className="filters-block">

        <h4>Поиск</h4>
        <input
          type="text"
          className="search-input"
          placeholder="Название или адрес..."
          value={draft.q}
          onChange={(e) => setDraft({ ...draft, q: e.target.value })}
        />

        <hr />

        <h4>Тип отходов</h4>
        <label className="chk">
          <input
            type="radio"
            name="wt"
            checked={draft.waste_type === ""}
            onChange={() => setDraft({ ...draft, waste_type: "" })}
          /> Все
        </label>

        {WASTE_TYPES.map(({ label, value }) => (
        <label key={value} className="chk">
          <input
            type="radio"
            name="wt"
            checked={draft.waste_type === value}
            onChange={() => setDraft({ ...draft, waste_type: value })}
          /> {label}
        </label>
      ))}

        <hr />

        <h4>Режим работы</h4>
        <label className="chk">
          <input
            type="radio"
            name="open"
            checked={draft.open_now === ""}
            onChange={() => setDraft({ ...draft, open_now: "" })}
          /> Все
        </label>

        <label className="chk">
          <input
            type="radio"
            name="open"
            checked={draft.open_now === "true"}
            onChange={() => setDraft({ ...draft, open_now: "true" })}
          /> Открыто
        </label>

        <hr />

        <h4>Сортировка</h4>
        <select
          value={draft.sort_by}
          onChange={(e) => setDraft({ ...draft, sort_by: e.target.value })}
        >
          <option value="">По умолчанию</option>
          <option value="name">По названию</option>
          <option value="address">По адресу</option>
        </select>

        <select
          value={draft.sort_dir}
          disabled={!draft.sort_by}
          onChange={(e) => setDraft({ ...draft, sort_dir: e.target.value })}
        >
          <option value="asc">А → Я</option>
          <option value="desc">Я → А</option>
        </select>

        <hr />

        <h4>На странице</h4>
        <select
          value={draft.limit}
          onChange={(e) =>
            setDraft({ ...draft, limit: Number(e.target.value) })
          }
        >
          {[5, 10, 20].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <div className="filters-actions">
          <button className="btn ghost" onClick={handleReset}>
            Сбросить
          </button>
          <button className="btn primary" onClick={apply}>
            Применить
          </button>
        </div>

      </div>
    </SidebarShell>
  );
}