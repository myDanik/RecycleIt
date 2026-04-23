import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React, { useState } from "react";
import api from "../../src/services/api";

function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login({ username, password });
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return React.createElement("form", { onSubmit: handleSubmit },
    React.createElement("input", {
      "data-testid": "username-input",
      value: username,
      onChange: (e: any) => setUsername(e.target.value),
      placeholder: "Логин",
    }),
    React.createElement("input", {
      "data-testid": "password-input",
      type: "password",
      value: password,
      onChange: (e: any) => setPassword(e.target.value),
      placeholder: "Пароль",
    }),
    React.createElement("button", {
      "data-testid": "submit-btn",
      type: "submit",
      disabled: loading,
    }, loading ? "Загрузка..." : "Войти"),
    error && React.createElement("div", { "data-testid": "error-msg" }, error)
  );
}


describe("LoginForm — пользовательские сценарии", () => {
  beforeEach(() => {
    vi.spyOn(api, "login");
    localStorage.clear();
  });

  it("рендерится с полями username и password", () => {
    render(React.createElement(LoginForm));
    expect(screen.getByTestId("username-input")).toBeTruthy();
    expect(screen.getByTestId("password-input")).toBeTruthy();
    expect(screen.getByTestId("submit-btn")).toBeTruthy();
  });

  it("показывает состояние загрузки при отправке", async () => {
    let resolveLogin!: () => void;
    (api.login as any).mockReturnValue(new Promise<void>((res) => { resolveLogin = res; }));

    render(React.createElement(LoginForm));
    fireEvent.change(screen.getByTestId("username-input"), { target: { value: "alice" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "pass" } });
    fireEvent.submit(screen.getByTestId("submit-btn").closest("form")!);

    await waitFor(() => {
      expect(screen.getByTestId("submit-btn").textContent).toBe("Загрузка...");
      expect((screen.getByTestId("submit-btn") as HTMLButtonElement).disabled).toBe(true);
    });

    resolveLogin();
  });

  it("показывает ошибку при неверных данных", async () => {
    (api.login as any).mockRejectedValue({ status: 401, message: "Неверный логин или пароль" });

    render(React.createElement(LoginForm));
    fireEvent.change(screen.getByTestId("username-input"), { target: { value: "bad" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "wrong" } });
    fireEvent.submit(screen.getByTestId("submit-btn").closest("form")!);

    await waitFor(() => {
      expect(screen.getByTestId("error-msg")).toBeTruthy();
      expect(screen.getByTestId("error-msg").textContent).toBe("Неверный логин или пароль");
    });
  });

  it("не показывает ошибку в начальном состоянии", () => {
    render(React.createElement(LoginForm));
    expect(screen.queryByTestId("error-msg")).toBeNull();
  });

  it("вызывает onSuccess при успешном входе", async () => {
    (api.login as any).mockResolvedValue({
      access_token: "tok", refresh_token: "ref", id: 1, username: "alice", role: "user",
    });

    const onSuccess = vi.fn();
    render(React.createElement(LoginForm, { onSuccess }));
    fireEvent.change(screen.getByTestId("username-input"), { target: { value: "alice" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "pass" } });
    fireEvent.submit(screen.getByTestId("submit-btn").closest("form")!);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });

  it("кнопка разблокируется после завершения запроса", async () => {
    (api.login as any).mockResolvedValue({
      access_token: "tok", refresh_token: "ref", id: 1, username: "alice", role: "user",
    });

    render(React.createElement(LoginForm));
    fireEvent.change(screen.getByTestId("username-input"), { target: { value: "alice" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "pass" } });
    fireEvent.submit(screen.getByTestId("submit-btn").closest("form")!);

    await waitFor(() => {
      expect((screen.getByTestId("submit-btn") as HTMLButtonElement).disabled).toBe(false);
    });
  });
});
