// src/pages/SidebarInfo.jsx
//
// Страница конкретного пункта приёма вторсырья.
// URL изменён: /sidebar/info/:id → /sidebar/points/:id
//
// SEO-цель: попасть в индекс по запросам вида "сдать пластик [адрес]",
// "пункт приёма [название]".

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SidebarShell from "../shared/SidebarShell";
import SEOMeta from "../shared/SEOMeta";
import api from "../services/api";

export default function SidebarInfo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [point, setPoint] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);

  const currentUser = api.getCurrentUser();
  const isAdmin = api.isAdmin();
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    if (id) {
      loadPoint();
      loadFeedback();
      loadPhoto();
    }
  }, [id]);

  async function loadPhoto() {
    try {
      const data = await api.request(`/points/${id}/photo`);
      setPhotoUrl(data.photo_url);
    } catch (err) {
      alert(err.message || "Ошибка загрузки фото");
    }
  }

  async function handleUploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { photo_url } = await api.uploadPointPhoto(Number(id), file);
      setPhotoUrl(photo_url);
    } catch (err) {
      alert(err.message || "Ошибка загрузки фото");
    }
  }

  async function handleDeletePhoto() {
    if (!window.confirm("Удалить фото?")) return;
    try {
      await api.deletePointPhoto(Number(id));
      setPhotoUrl(null);
    } catch (err) {
      alert(err.message || "Ошибка удаления фото");
    }
  }

  async function loadPoint() {
    try {
      const data = await api.getPointById(id);
      setPoint(data);
    } catch (err) {
      setError("Не удалось загрузить информацию о пункте");
    }
  }

  async function loadFeedback() {
    try {
      const data = await api.getFeedback(id);
      setFeedback(data);
    } catch (err) {
      console.error("Не удалось загрузить отзывы:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePoint() {
    if (!window.confirm("Удалить этот пункт?")) return;
    try {
      await api.deletePoint(id);
      navigate("/sidebar/points");
    } catch (err) {
      alert(err.message || "Ошибка удаления");
    }
  }

  async function handleDeleteFeedback(feedbackId) {
    if (!window.confirm("Удалить отзыв?")) return;
    try {
      await api.deleteFeedback(feedbackId);
      setFeedback(feedback.filter((f) => f.id !== feedbackId));
    } catch (err) {
      alert(err.message || "Ошибка удаления отзыва");
    }
  }

  if (loading) {
    return (
      <>
        <SEOMeta title="Загрузка пункта…" canonicalPath={`/sidebar/points/${id}`} />
        <SidebarShell title="Загрузка…" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEOMeta title="Ошибка загрузки" canonicalPath={`/sidebar/points/${id}`} />
        <SidebarShell title="Ошибка">
          <p role="alert" className="error">{error}</p>
          <button onClick={() => navigate("/sidebar/points")}>Назад</button>
        </SidebarShell>
      </>
    );
  }

  if (!point) {
    return (
      <>
        <SEOMeta title="Пункт не найден" canonicalPath={`/sidebar/points/${id}`} />
        <SidebarShell title="Не найдено">
          <p>Пункт не найден</p>
          <button onClick={() => navigate("/sidebar/points")}>Назад</button>
        </SidebarShell>
      </>
    );
  }

  const wasteList = point.waste_types?.join(", ") || "";
  const hoursText =
    point.opens_at && point.closes_at
      ? ` Часы работы: ${point.opens_at.slice(0, 5)}–${point.closes_at.slice(0, 5)}.`
      : "";

  const metaDescription =
    `Пункт приёма вторсырья «${point.name}».` +
    (wasteList ? ` Принимает: ${wasteList}.` : "") +
    (point.address ? ` Адрес: ${point.address}.` : "") +
    hoursText;

  const ogImage = photoUrl || undefined;

  const canonicalPath = `/sidebar/points/${id}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RecyclingCenter",
    name: point.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: point.address || "",
      addressLocality: "Москва",
      addressCountry: "RU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: point.latitude,
      longitude: point.longitude,
    },
  };


  return (
    <>
      <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <SEOMeta
        title={point.name}
        description={metaDescription}
        image={ogImage}
        canonicalPath={canonicalPath}
      />

      <SidebarShell title={point.name}>

        {photoUrl && (
          <figure style={{ margin: "0 0 12px", position: "relative" }}>

            <img
              src={photoUrl}
              alt={`Фото пункта приёма вторсырья «${point.name}»${point.address ? `, ${point.address}` : ""}`}
              style={{
                width: "100%",
                borderRadius: "8px",
                objectFit: "cover",
                maxHeight: "200px",
                display: "block",
              }}
              loading="lazy"
            />
            {isAdmin && (
              <button
                onClick={handleDeletePhoto}
                aria-label="Удалить фото"
                style={{
                  position: "absolute", top: "6px", right: "6px",
                  background: "rgba(0,0,0,0.5)", color: "white",
                  border: "none", borderRadius: "4px",
                  padding: "2px 8px", cursor: "pointer", fontSize: "12px",
                }}
              >
                ✕
              </button>
            )}
            <figcaption style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
              {point.name}{point.address ? ` — ${point.address}` : ""}
            </figcaption>
          </figure>
        )}

        {isAdmin && (
          <label style={{ display: "inline-block", marginBottom: "12px", cursor: "pointer" }}>
            <span className="btn ghost" style={{ fontSize: "12px" }}>
              {photoUrl ? "Заменить фото" : "+ Добавить фото"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleUploadPhoto}
            />
          </label>
        )}

        <article className="info-block">
          <h1 style={{ fontSize: "18px", marginTop: 0, marginBottom: "12px" }}>
            {point.name}
          </h1>

          <section aria-labelledby="address-heading">
            <h2 id="address-heading" style={{ fontSize: "14px", marginBottom: "4px" }}>
              Адрес
            </h2>
            <address style={{ fontStyle: "normal" }}>
              {point.address || "Не указан"}
            </address>
          </section>

          {point.waste_types?.length > 0 && (
            <section aria-labelledby="waste-heading" style={{ margin: "16px 0" }}>
              <h2 id="waste-heading" style={{ fontSize: "14px", marginBottom: "8px" }}>
                Принимает
              </h2>
              <ul
                style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "5px" }}
              >
                {point.waste_types.map((type, i) => (
                  <li key={i} className="tag">{type}</li>
                ))}
              </ul>
            </section>
          )}

          {point.opens_at && point.closes_at && (
            <section aria-labelledby="hours-heading">
              <h2 id="hours-heading" style={{ fontSize: "14px", marginBottom: "4px" }}>
                Часы работы
              </h2>
              <p>
                <time dateTime={`${point.opens_at}/${point.closes_at}`}>
                  {point.opens_at.slice(0, 5)} – {point.closes_at.slice(0, 5)}
                </time>
              </p>
            </section>
          )}

          <nav
            aria-label="Действия с пунктом"
            style={{ marginTop: "20px", display: "flex", gap: "10px", flexWrap: "wrap" }}
          >
            <button className="btn ghost" onClick={() => navigate("/sidebar/points")}>
              Назад
            </button>

            {isAuthenticated && (
              <button className="btn" onClick={() => navigate(`/sidebar/feedback/${id}`)}>
                Оставить отзыв
              </button>
            )}

            {isAdmin && (
              <>
                <button className="btn" onClick={() => navigate(`/sidebar/point/${id}`)}>
                  Редактировать
                </button>
                <button className="btn ghost" onClick={handleDeletePoint}>
                  Удалить пункт
                </button>
              </>
            )}
          </nav>

          <hr style={{ margin: "20px 0" }} />

          <section aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" style={{ fontSize: "16px", marginBottom: "12px" }}>
              Отзывы
              {feedback.length > 0 && (
                <span style={{ fontWeight: 400, fontSize: "13px", marginLeft: "8px", color: "#888" }}>
                  ({feedback.length})
                </span>
              )}
            </h2>

            {feedback.length === 0 ? (
              <p className="empty">Отзывов пока нет</p>
            ) : (
              <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {feedback.map((item) => {
                  const canDelete = isAdmin || currentUser?.id === item.user_id;
                  return (
                    <li key={item.id}>
                      <article className="review">
                        <header>
                          <h3 className="review-name" style={{ margin: 0, fontSize: "14px" }}>
                            {item.username || "Аноним"}
                          </h3>
                        </header>

                        <p className="review-text">{item.message}</p>

                        <footer
                          className="review-meta"
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        >
                          <span>
                            {item.rating && (
                              <span aria-label={`Оценка: ${item.rating} из 5`}>
                                {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}{" "}
                              </span>
                            )}
                            <time dateTime={item.created_at}>
                              {new Date(item.created_at).toLocaleDateString("ru-RU")}
                            </time>
                          </span>

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteFeedback(item.id)}
                              aria-label={`Удалить отзыв пользователя ${item.username || "Аноним"}`}
                              style={{
                                background: "none",
                                border: "none",
                                color: "red",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              Удалить
                            </button>
                          )}
                        </footer>
                      </article>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </article>
      </SidebarShell>
    </>
  );
}