import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "../../src/services/api";

function mockFetch(status: number, body: object) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as unknown as Response);
}



describe("api.login", () => {
  it("сохраняет токены в localStorage при успешном входе", async () => {
    mockFetch(200, {
      access_token: "acc123",
      refresh_token: "ref456",
      id: 1,
      username: "alice",
      role: "user",
    });

    await api.login({ username: "alice", password: "pass" });

    expect(localStorage.getItem("access_token")).toBe("acc123");
    expect(localStorage.getItem("refresh_token")).toBe("ref456");
    expect(JSON.parse(localStorage.getItem("user")!).username).toBe("alice");
  });

  it("не сохраняет данные при ошибке 401", async () => {
    mockFetch(401, { detail: "Invalid credentials" });
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      json: async () => ({ detail: "Invalid credentials" }),
    } as unknown as Response);

    await expect(api.login({ username: "alice", password: "wrong" })).rejects.toBeDefined();
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});


describe("api.logout", () => {
  it("очищает localStorage и редиректит на /sidebar/login", () => {
    localStorage.setItem("access_token", "token");
    localStorage.setItem("refresh_token", "refresh");
    localStorage.setItem("user", JSON.stringify({ id: 1 }));

    delete (window as any).location;
    (window as any).location = { href: "" };

    api.logout();

    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("refresh_token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(window.location.href).toBe("/sidebar/login");
  });
});


describe("api.getCurrentUser", () => {
  it("возвращает null когда user не в localStorage", () => {
    expect(api.getCurrentUser()).toBeNull();
  });

  it("возвращает объект пользователя из localStorage", () => {
    const user = { id: 1, username: "alice", role: "user" };
    localStorage.setItem("user", JSON.stringify(user));
    expect(api.getCurrentUser()).toEqual(user);
  });
});


describe("api.isAdmin", () => {
  it("возвращает false без пользователя", () => {
    expect(api.isAdmin()).toBe(false);
  });

  it("возвращает false для role=user", () => {
    localStorage.setItem("user", JSON.stringify({ role: "user" }));
    expect(api.isAdmin()).toBe(false);
  });

  it("возвращает true для role=admin", () => {
    localStorage.setItem("user", JSON.stringify({ role: "admin" }));
    expect(api.isAdmin()).toBe(true);
  });
});


describe("api.request — обработка ошибок", () => {
  it("выбрасывает объект с status=403 при ответе 403", async () => {
    mockFetch(403, { detail: "Forbidden" });
    localStorage.setItem("access_token", "token");

    await expect(api.getPoints()).rejects.toMatchObject({ status: 403 });
  });

  it("при 401 пытается обновить токен через refreshAccessToken", async () => {
    localStorage.setItem("access_token", "old_token");
    localStorage.setItem("refresh_token", "valid_refresh");

    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      if (url.includes("/auth/refresh")) {
        return { ok: true, status: 200, json: async () => ({ access_token: "new_token" }) };
      }
      callCount++;
      if (callCount === 1) {
        return { ok: false, status: 401, json: async () => ({}) };
      }
      return { ok: true, status: 200, json: async () => ([]) };
    });

    const result = await api.getPoints();
    expect(result).toEqual([]);
    expect(localStorage.getItem("access_token")).toBe("new_token");
  });

  it("при 401 и неудачном refresh — редиректит на login", async () => {
    delete (window as any).location;
    (window as any).location = { href: "" };

    localStorage.setItem("access_token", "expired");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: async () => ({}),
    } as unknown as Response);

    await expect(api.getPoints()).rejects.toBeDefined();
    expect(window.location.href).toBe("/sidebar/login");
  });
});


describe("api.getPoints — фильтры", () => {
  it("строит корректный URL с параметрами фильтрации", async () => {
    mockFetch(200, []);
    await api.getPoints({ q: "стекло", waste_type: "glass", open_now: true });

    const calledUrl = (globalThis.fetch as any).mock.calls[0][0] as string;
    expect(calledUrl).toContain("waste_type=glass");
    expect(calledUrl).toContain("open_now=true");
  });

  it("строит URL без лишних параметров когда фильтры не заданы", async () => {
    mockFetch(200, []);
    await api.getPoints();

    const calledUrl = (globalThis.fetch as any).mock.calls[0][0] as string;
    expect(calledUrl).toBe("http://localhost:8080/api/points/");
  });
});


describe("api.refreshAccessToken", () => {
  it("возвращает false если нет refresh_token", async () => {
    const result = await api.refreshAccessToken();
    expect(result).toBe(false);
  });

  it("обновляет access_token при успехе", async () => {
    localStorage.setItem("refresh_token", "valid_refresh");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ access_token: "brand_new_token" }),
    } as unknown as Response);

    const result = await api.refreshAccessToken();
    expect(result).toBe(true);
    expect(localStorage.getItem("access_token")).toBe("brand_new_token");
  });

  it("вызывает logout при неудачном refresh", async () => {
    localStorage.setItem("refresh_token", "bad_token");
    localStorage.setItem("access_token", "old");
    delete (window as any).location;
    (window as any).location = { href: "" };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 401, json: async () => ({}),
    } as unknown as Response);

    const result = await api.refreshAccessToken();
    expect(result).toBe(false);
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});
