import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";

import Layout from "./components/Layout";
import SidebarMain from "./sidebars/SidebarMain";
import SidebarFilters from "./sidebars/SidebarFilters";
import SidebarInfo from "./sidebars/SidebarInfo";
import SidebarFeedback from "./sidebars/SidebarFeedback";
import SidebarAuth from "./sidebars/SidebarAuth";
import SidebarAdmin from "./sidebars/SidebarAdmin";
import SidebarPointForm from "./sidebars/SidebarPointForm";

// компонент-редирект с параметром :id
function RedirectToNewPoint() {
  const { id } = useParams();
  return <Navigate to={`/sidebar/points/${id}`} replace />;
}

export default function App() {
  return (
      <Routes>
        <Route path="/" element={<Layout />}>
          
          {/* Главная */}
          <Route index element={<Navigate to="/sidebar/points" replace />} />

          {/* Старые URL → редиректы */}
          <Route path="sidebar/main" element={<Navigate to="/sidebar/points" replace />} />
          <Route path="sidebar/info/:id" element={<RedirectToNewPoint />} />

          {/* Новые SEO-дружелюбные URL */}
          <Route path="sidebar/points" element={<SidebarMain />} />
          <Route path="sidebar/points/:id" element={<SidebarInfo />} />

          {/* Остальные */}
          <Route path="sidebar/filters" element={<SidebarFilters />} />
          <Route path="sidebar/feedback/:id" element={<SidebarFeedback />} />
          <Route path="sidebar/login" element={<SidebarAuth />} />
          <Route path="sidebar/admin" element={<SidebarAdmin />} />
          <Route path="sidebar/point/:id" element={<SidebarPointForm />} />
        </Route>

        <Route path="*" element={<div style={{ padding: 20 }}>404 — Not found</div>} />
      </Routes>
  );
}