import React from "react";

export default function SidebarShell({ title, children }) {
  return (
    <div className="sidebar-shell">
      <header className="sidebar-header">
        <h3 className="sidebar-title">{title}</h3>
      </header>

      <div className="sidebar-content">{children}</div>
    </div>
  );
}