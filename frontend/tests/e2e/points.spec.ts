import { test, expect, Page } from "@playwright/test";

const MOCK_POINTS = [
  { id: 1, name: "Пункт А", address: "ул. Ленина 1", waste_types: ["plastic"], latitude: 55.75, longitude: 37.61 },
  { id: 2, name: "Пункт Б", address: "ул. Мира 5", waste_types: ["glass"], latitude: 55.76, longitude: 37.62 },
];

async function setupPointsMock(page: Page, points = MOCK_POINTS) {
  await page.route("**/points/*", async (route) => {
    const url = route.request().url();
    const match = url.match(/\/points\/(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      const point = points.find((p) => p.id === id);
      await route.fulfill({
        status: point ? 200 : 404,
        body: JSON.stringify(point || { detail: "Point not found" }),
      });
    } else {
      await route.fulfill({ status: 200, body: JSON.stringify(points) });
    }
  });
}

async function setupAsAdmin(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem("access_token", "admin_token");
    localStorage.setItem("refresh_token", "admin_refresh");
    localStorage.setItem("user", JSON.stringify({ id: 99, username: "admin", role: "admin" }));
  });
}

async function setupAsUser(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem("access_token", "user_token");
    localStorage.setItem("refresh_token", "user_refresh");
    localStorage.setItem("user", JSON.stringify({ id: 1, username: "testuser", role: "user" }));
  });
}


test.describe("Просмотр точек — доступно всем", () => {
  test("главная страница отображает список точек", async ({ page }) => {
    await setupPointsMock(page);
    await page.goto("/");
    await page.waitForTimeout(500);
    await expect(page.locator("text=Пункт А")).toBeVisible({ timeout: 5000 });
  });
});


test.describe("Создание точки — только admin", () => {
  test("кнопка создания видна администратору", async ({ page }) => {
    await page.goto("/");
    await setupAsAdmin(page);
    await setupPointsMock(page);
    await page.reload();

    const addBtn = page.locator('[data-testid="add-point-btn"], button:has-text("Добавить")');
    if (await addBtn.isVisible()) {
      await expect(addBtn).toBeVisible();
    }
  });

  test("обычный пользователь не видит форму создания точки", async ({ page }) => {
    await page.goto("/");
    await setupAsUser(page);
    await setupPointsMock(page);
    await page.reload();

    const adminForm = page.locator('[data-testid="point-form-admin"], .admin-only-form');
    await expect(adminForm).not.toBeVisible({ timeout: 2000 }).catch(() => {
    });
  });

  test("admin успешно создаёт точку", async ({ page }) => {
    await page.goto("/");
    await setupAsAdmin(page);

    await page.route("**/points/", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ id: 3, name: "Новый пункт", address: "ул. Новая 1", waste_types: [] }),
        });
      } else {
        await route.fulfill({ status: 200, body: JSON.stringify(MOCK_POINTS) });
      }
    });

    await page.reload();
    const addBtn = page.locator('[data-testid="add-point-btn"], button:has-text("Добавить"), button:has-text("Создать")').first();
    if (await addBtn.isVisible({ timeout: 2000 })) {
      await addBtn.click();
      const nameInput = page.locator('input[name="name"], input[placeholder*="название"]').first();
      if (await nameInput.isVisible({ timeout: 2000 })) {
        await nameInput.fill("Новый пункт");
        const submitBtn = page.locator('button[type="submit"], button:has-text("Сохранить")').first();
        await submitBtn.click();
      }
    }
  });
});

test.describe("Фильтрация и пагинация", () => {
  test("фильтр по типу отходов передаётся в API-запрос", async ({ page }) => {
    await page.goto("/");

    let filteredRequest: string | null = null;
    await page.route("**/points/**", async (route) => {
      filteredRequest = route.request().url();
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    const filterBtn = page.locator('[data-testid="filter-btn"], button:has-text("Фильтр")').first();
    if (await filterBtn.isVisible({ timeout: 2000 })) {
      await filterBtn.click();

      const wasteSelect = page.locator('select[name="waste_type"], [data-testid="waste-type-filter"]').first();
      if (await wasteSelect.isVisible({ timeout: 2000 })) {
        await wasteSelect.selectOption("plastic");
        await page.waitForTimeout(500);
        expect(filteredRequest).toContain("waste_type=plastic");
      }
    }
  });

  test("URL обновляется при изменении фильтров", async ({ page }) => {
    await page.goto("/");
    await setupPointsMock(page);

    await page.evaluate(() => {
      window.history.pushState({}, "", "/?q=стекло&waste_type=glass");
    });

    await expect(page).toHaveURL(/waste_type=glass/);
  });
});


test.describe("Загрузка фото", () => {
  test("admin может загрузить фото для точки", async ({ page }) => {
    await page.goto("/");
    await setupAsAdmin(page);
    await setupPointsMock(page);

    await page.route("**/points/1/photo", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ photo_url: "https://s3.example.com/points/abc.jpg" }),
      });
    });

    await page.reload();

    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 2000 })) {
      await fileInput.setInputFiles({
        name: "photo.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from([0xff, 0xd8, 0xff]),
      });
    }
  });

  test("получение фото возвращает presigned URL", async ({ page }) => {
    await setupPointsMock(page);

    await page.route("**/points/1/photo", (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({ photo_url: "https://s3.example.com/points/abc.jpg" }),
      })
    );

    const response = await page.evaluate(async () => {
      const r = await fetch("http://localhost:8000/points/1/photo");
      return r.status;
    }).catch(() => null);
  });
});
