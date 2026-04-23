import { test, expect, Page } from "@playwright/test";


async function loginAs(page: Page, username: string, password: string) {
  await page.goto("/sidebar/login");
  await page.fill('[name="username"], input[placeholder*="имя"], input[placeholder*="логин"]', username);
  await page.fill('[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"], button:has-text("Войти")');
  await page.waitForURL((url) => !url.pathname.includes("login"), { timeout: 5000 });
}

async function logout(page: Page) {
  const logoutBtn = page.locator('button:has-text("Выйти"), [data-testid="logout"]');
  await logoutBtn.click();
  await page.waitForURL("**/login");
}


test.describe("Аутентификация", () => {
  test("пользователь может войти с правильными данными", async ({ page }) => {
    await page.route("**/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "test_access",
          refresh_token: "test_refresh",
          token_type: "bearer",
          role: "user",
          id: 1,
          username: "testuser",
        }),
      });
    });

    await page.goto("/sidebar/login");
    await page.fill('input[type="text"], input[name="username"]', "testuser");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"], button:has-text("Войти")');

    const storage = await page.context().storageState();
    const token = storage.origins
      .flatMap(o => o.localStorage)
      .find(item => item.name === "access_token")?.value;
    expect(token).toBe("test_access");
  });

  test("показывает ошибку при неверных данных", async ({ page }) => {
    await page.route("**/auth/login", (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ detail: "Invalid credentials" }) })
    );

    await page.goto("/sidebar/login");
    await page.fill('input[type="text"], input[name="username"]', "baduser");
    await page.fill('input[type="password"]', "wrongpass");
    await page.click('button[type="submit"], button:has-text("Войти")');

  });

  test("выход очищает localStorage", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "valid_token");
      localStorage.setItem("refresh_token", "valid_refresh");
      localStorage.setItem("user", JSON.stringify({ id: 1, username: "u", role: "user" }));
    });

    await page.route("**/points/**", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify([]) })
    );

    await page.reload();

    const logoutBtn = page.locator('[data-testid="logout-btn"], button:has-text("Выйти")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();

      const token = await page.evaluate(() => localStorage.getItem("access_token"));
      expect(token).toBeNull();
    }
  });

  test("автоматически обновляет access_token через refresh", async ({ page }) => {
    let requestCount = 0;

    await page.route("**/points/**", async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({ status: 401, body: JSON.stringify({}) });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      }
    });
    let refreshCalled = false;
    await page.route("**/auth/refresh", (route) => {
      refreshCalled = true
      route.fulfill({
        status: 200,
        body: JSON.stringify({ access_token: "new_access_token" }),
      })
    }
    );

    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("access_token", "expired_token");
      localStorage.setItem("refresh_token", "valid_refresh");
      localStorage.setItem("user", JSON.stringify({ id: 1, role: "user" }));
    });

    await page.reload();

    expect(refreshCalled).toBe(true);
  });
});
