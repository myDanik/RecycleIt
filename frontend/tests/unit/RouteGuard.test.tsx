import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import api from "../../src/services/api";



function AdminOnly({ children }: { children: React.ReactNode }) {
  if (!api.isAdmin()) {
    return React.createElement("div", { "data-testid": "forbidden" }, "Нет доступа");
  }
  return React.createElement(React.Fragment, null, children);
}

function AuthRequired({ children }: { children: React.ReactNode }) {
  if (!api.getCurrentUser()) {
    return React.createElement("div", { "data-testid": "login-required" }, "Войдите в систему");
  }
  return React.createElement(React.Fragment, null, children);
}


describe("AdminOnly — ролевая защита маршрутов", () => {
  beforeEach(() => localStorage.clear());

  it("блокирует доступ без авторизации", () => {
    render(React.createElement(AdminOnly, null,
      React.createElement("div", { "data-testid": "admin-panel" }, "Панель администратора")
    ));
    expect(screen.getByTestId("forbidden")).toBeTruthy();
    expect(screen.queryByTestId("admin-panel")).toBeNull();
  });

  it("блокирует доступ для role=user", () => {
    localStorage.setItem("user", JSON.stringify({ role: "user" }));
    render(React.createElement(AdminOnly, null,
      React.createElement("div", { "data-testid": "admin-panel" }, "Панель администратора")
    ));
    expect(screen.getByTestId("forbidden")).toBeTruthy();
  });

  it("разрешает доступ для role=admin", () => {
    localStorage.setItem("user", JSON.stringify({ role: "admin" }));
    render(React.createElement(AdminOnly, null,
      React.createElement("div", { "data-testid": "admin-panel" }, "Панель администратора")
    ));
    expect(screen.getByTestId("admin-panel")).toBeTruthy();
    expect(screen.queryByTestId("forbidden")).toBeNull();
  });
});


describe("AuthRequired — защита авторизованных маршрутов", () => {
  beforeEach(() => localStorage.clear());

  it("показывает сообщение о входе без сессии", () => {
    render(React.createElement(AuthRequired, null,
      React.createElement("div", { "data-testid": "protected" }, "Защищённый контент")
    ));
    expect(screen.getByTestId("login-required")).toBeTruthy();
    expect(screen.queryByTestId("protected")).toBeNull();
  });

  it("показывает контент при наличии пользователя в localStorage", () => {
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "user" }));
    render(React.createElement(AuthRequired, null,
      React.createElement("div", { "data-testid": "protected" }, "Защищённый контент")
    ));
    expect(screen.getByTestId("protected")).toBeTruthy();
  });
});
