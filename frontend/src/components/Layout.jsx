import { useFilterState } from "../hooks/useFilterState";
import { lazy, Suspense, useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
const Map = lazy(() => import("./Map"));
import api from "../services/api";

export default function Layout() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { filters } = useFilterState();
  const getSelectedPointId = () => {
    const match = location.pathname.match(/\/info\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  };


  useEffect(() => {
    loadPoints();
  }, [filters.q, filters.waste_type, filters.open_now, filters.limit, filters.page]);


  async function loadPoints() {
    setLoading(true);
    try {
      const data = await api.getPoints({
        q:          filters.q || undefined,
        waste_type: filters.waste_type || undefined,
        open_now:   filters.open_now || undefined,
        limit:      filters.limit,
        skip:       ((Number(filters.page) || 1) - 1) * (Number(filters.limit) || 10),
      });
      setPoints(data);
    } catch (err) {
      console.error("Ошибка загрузки:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-root">
      <div className="page-top">
        <Header/>
      </div>

      <div className="content-row">
        <aside className="map-area">
          <Suspense fallback={<div style={{ height: 400 }}>Загрузка карты...</div>}>
            <Map 
              points={points} 
              selectedPointId={getSelectedPointId()} 
            />
          </Suspense>
        </aside>

        <section className="sidebar-area">
          <Outlet context={{ 
            points, 
            loading, 
            reloadPoints: loadPoints
          }} />
        </section>
      </div>
    </div>
  );
}