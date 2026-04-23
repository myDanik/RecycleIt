import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React, { useState } from "react";
import api from "../../src/services/api";

function FeedbackForm({ pointId, onSubmit }: { pointId: number; onSubmit?: () => void }) {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Сообщение не может быть пустым");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.createFeedback({ point_id: pointId, message, rating });
      setSuccess(true);
      setMessage("");
      onSubmit?.();
    } catch (err: any) {
      setError(err?.message || "Ошибка отправки");
    } finally {
      setLoading(false);
    }
  };

  return React.createElement("form", { onSubmit: handleSubmit },
    React.createElement("textarea", {
      "data-testid": "message-input",
      value: message,
      onChange: (e: any) => setMessage(e.target.value),
      placeholder: "Ваш отзыв",
    }),
    React.createElement("input", {
      "data-testid": "rating-input",
      type: "number", min: 1, max: 5,
      value: rating,
      onChange: (e: any) => setRating(parseInt(e.target.value)),
    }),
    React.createElement("button", {
      "data-testid": "submit-btn",
      type: "submit",
      disabled: loading,
    }, loading ? "Отправка..." : "Отправить"),
    error && React.createElement("div", { "data-testid": "error-msg" }, error),
    success && React.createElement("div", { "data-testid": "success-msg" }, "Отзыв отправлен!")
  );
}


describe("FeedbackForm", () => {
  beforeEach(() => {
    vi.spyOn(api, "createFeedback");
    localStorage.setItem("user", JSON.stringify({ id: 1, role: "user" }));
  });

  it("рендерится корректно", () => {
    render(React.createElement(FeedbackForm, { pointId: 1 }));
    expect(screen.getByTestId("message-input")).toBeTruthy();
    expect(screen.getByTestId("rating-input")).toBeTruthy();
    expect(screen.getByTestId("submit-btn")).toBeTruthy();
  });

  it("показывает ошибку при пустом сообщении (клиентская валидация)", async () => {
    render(React.createElement(FeedbackForm, { pointId: 1 }));
    fireEvent.submit(screen.getByTestId("submit-btn").closest("form")!);

    await waitFor(() => {
      expect(screen.getByTestId("error-msg").textContent).toContain("пустым");
    });
    expect(api.createFeedback).not.toHaveBeenCalled();
  });

  it("успешно отправляет отзыв и показывает подтверждение", async () => {
    (api.createFeedback as any).mockResolvedValue({
      id: 1, point_id: 1, user_id: 1, message: "Отлично", rating: 5, created_at: new Date().toISOString()
    });

    render(React.createElement(FeedbackForm, { pointId: 1 }));
    fireEvent.change(screen.getByTestId("message-input"), { target: { value: "Отличный пункт!" } });
    fireEvent.submit(screen.getByTestId("submit-btn").closest("form")!);

    await waitFor(() => {
      expect(screen.getByTestId("success-msg")).toBeTruthy();
    });
    expect(api.createFeedback).toHaveBeenCalledWith({
      point_id: 1, message: "Отличный пункт!", rating: 5,
    });
  });

  it("показывает ошибку сервера 403", async () => {
    (api.createFeedback as any).mockRejectedValue({ status: 403, message: "Недостаточно прав доступа" });

    render(React.createElement(FeedbackForm, { pointId: 1 }));
    fireEvent.change(screen.getByTestId("message-input"), { target: { value: "Тест" } });
    fireEvent.submit(screen.getByTestId("submit-btn").closest("form")!);

    await waitFor(() => {
      expect(screen.getByTestId("error-msg").textContent).toBe("Недостаточно прав доступа");
    });
  });

  it("сбрасывает поле сообщения после успешной отправки", async () => {
    (api.createFeedback as any).mockResolvedValue({ id: 1 });

    render(React.createElement(FeedbackForm, { pointId: 1 }));
    fireEvent.change(screen.getByTestId("message-input"), { target: { value: "Хорошее место" } });
    fireEvent.submit(screen.getByTestId("submit-btn").closest("form")!);

    await waitFor(() => screen.getByTestId("success-msg"));
    expect((screen.getByTestId("message-input") as HTMLTextAreaElement).value).toBe("");
  });
});
