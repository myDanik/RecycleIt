// src/pages/SidebarMain.jsx
//
// Страница-список всех пунктов приёма вторсырья.
// SEO-цель: попасть в индекс по запросам вида "пункты приёма вторсырья [город]".

import React, { useMemo } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import SidebarShell from "../shared/SidebarShell";
import SEOMeta from "../shared/SEOMeta";
import { useFilterState } from "../hooks/useFilterState";
import api from "../services/api";

// ── ListItem ─────────────────────────────────────────────────────────────────
// Вынесен в отдельный компонент для читаемости.
// Используем <article> — семантически это самостоятельная единица контента.
// Поисковики понимают, что внутри <article> находится законченный смысловой блок.
//
// Изменение URL: было /sidebar/info/:id → стало /sidebar/points/:id
// Причина: "points" (пункты) описывает ресурс. "info" — слишком абстрактно
// и ничего не говорит поисковику о содержимом страницы.
function ListItem({ point, isSelected = false }) {
  const navigate = useNavigate();

  return (
    <article
      className={`list-item ${isSelected ? "selected" : ""}`}
      onClick={() => navigate(`/sidebar/points/${point.id}`)}
      style={{ cursor: "pointer" }}
      aria-label={`Пункт приёма: ${point.name}`}
      aria-current={isSelected ? "page" : undefined}
    >
      <div className="list-item-left">
        <h3 className="item-name" style={{ margin: 0, fontSize: "inherit" }}>
          {point.name}
        </h3>

        <address className="item-address" style={{ fontStyle: "normal" }}>
          {point.address || "Адрес не указан"}
        </address>

        {point.waste_types?.length > 0 && (
          <ul
            className="item-types"
            aria-label="Принимаемые типы отходов"
            style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "4px" }}
          >
            {point.waste_types.map((type, i) => (
              <li key={i} className="tag">{type}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="list-item-right">
        {point.opens_at && point.closes_at && (
          <time className="item-hours" dateTime={`${point.opens_at}/${point.closes_at}`}>
            {point.opens_at.slice(0, 5)} – {point.closes_at.slice(0, 5)}
          </time>
        )}
      </div>
    </article>
  );
}

export default function SidebarMain() {
  const navigate = useNavigate();
  const location = useLocation();
  const { points, loading, searchQuery } = useOutletContext();
  const { filters } = useFilterState();
  const isAdmin = api.isAdmin();

  const selectedPointId = (() => {
    const match = location.pathname.match(/\/points\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  })();

  const sorted = useMemo(() => {
    if (!filters.sort_by) return points;
    return [...points].sort((a, b) => {
      const av = String(a[filters.sort_by] ?? "");
      const bv = String(b[filters.sort_by] ?? "");
      return filters.sort_dir === "asc"
        ? av.localeCompare(bv, "ru")
        : bv.localeCompare(av, "ru");
    });
  }, [points, filters.sort_by, filters.sort_dir]);

  const metaDescription = searchQuery
    ? `Результаты поиска "${searchQuery}" — пункты приёма вторсырья на карте. Пластик, стекло, макулатура, металл.`
    : `Все пункты приёма вторсырья на карте. Найдите ближайший пункт для сдачи пластика, стекла, бумаги и металла.`;

  return (
    <>
      <SEOMeta
        title="Пункты приёма вторсырья"
        description={metaDescription}
        canonicalPath="/sidebar/points"
      />

      <SidebarShell>
        <section aria-labelledby="points-heading">
          <h1
            id="points-heading"
            style={{ fontSize: "16px", margin: "10px 10px 4px", fontWeight: 600 }}
          >
            Пункты приёма вторсырья
            {sorted.length > 0 && (
              <span style={{ fontWeight: 400, fontSize: "13px", marginLeft: "8px", color: "#888" }}>
                ({sorted.length})
              </span>
            )}
          </h1>

          {isAdmin && (
            <button
              className="btn primary"
              onClick={() => navigate("/sidebar/point/new")}
              style={{ margin: "10px 10px 0" }}
            >
              + Добавить пункт
            </button>
          )}

          {loading ? (
            <p aria-live="polite" style={{ padding: "16px 10px", color: "#888" }}>
              Загрузка пунктов…
            </p>
          ) : sorted.length === 0 ? (
            <p style={{ padding: "16px 10px", color: "#888" }}>
              Пункты не найдены
            </p>
          ) : (
            sorted.map((point) => (
              <ListItem
                key={point.id}
                point={point}
                isSelected={point.id === selectedPointId}
              />
            ))
          )}
        </section>
      </SidebarShell>
    </>
  );
}