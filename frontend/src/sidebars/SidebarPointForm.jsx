import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SidebarShell from "../shared/SidebarShell";
import api from "../services/api";

const WASTE_TYPES = [
  { label: "Стекло",      value: "glass" },
  { label: "Пластик",     value: "plastic" },
  { label: "Металл",      value: "metal" },
  { label: "Бумага",      value: "paper" },
  { label: "Электроника", value: "electronics" },
];

const EMPTY_FORM = {
  name: "",
  address: "",
  opens_at: "",
  closes_at: "",
  waste_types: [],
};

function validate(data) {
  const errors = {};

  if (!data.name.trim())
    errors.name = "Название обязательно";
  else if (data.name.trim().length < 3)
    errors.name = "Минимум 3 символа";

  if (!data.address.trim())
    errors.address = "Адрес обязателен";

  if (data.waste_types.length === 0)
    errors.waste_types = "Выберите хотя бы один тип отходов";

  if (data.opens_at && data.closes_at && data.opens_at >= data.closes_at)
    errors.closes_at = "Время закрытия должно быть позже открытия";

  return errors;
}

export default function SidebarPointForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      api.getPointById(Number(id))
        .then((data) => {
          setForm({
            name:        data.name ?? "",
            address:     data.address ?? "",
            opens_at:    data.opens_at?.slice(0, 5) ?? "",
            closes_at:   data.closes_at?.slice(0, 5) ?? "",
            waste_types: data.waste_types ?? [],
          });
        })
        .catch((err) => {
          if (err.status === 404) setServerError("Пункт не найден");
          else setServerError("Ошибка загрузки данных");
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleToggleWasteType = (value) => {
    setForm((prev) => {
      const has = prev.waste_types.includes(value);
      return {
        ...prev,
        waste_types: has
          ? prev.waste_types.filter((t) => t !== value)
          : [...prev.waste_types, value],
      };
    });
    if (errors.waste_types) setErrors((prev) => ({ ...prev, waste_types: undefined }));
  };

  const handleSubmit = async () => {
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setServerError(null);

    const payload = {
      ...form,
      opens_at:  form.opens_at || null,
      closes_at: form.closes_at || null,
    };

    try {
      if (isNew) {
        const created = await api.createPoint(payload);
        navigate(`/sidebar/info/${created.id}`);
      } else {
        await api.updatePoint(Number(id), payload);
        navigate(`/sidebar/info/${id}`);
      }
    } catch (err) {
      if (err.status === 409)
        setServerError("Пункт с таким адресом уже существует");
      else if (err.status === 403)
        setServerError("Недостаточно прав доступа");
      else if (err.status === 422)
        setServerError("Некорректные данные — проверьте заполненные поля");
      else
        setServerError(err.message || "Произошла ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SidebarShell title="Загрузка..." />;

  return (
    <SidebarShell title={isNew ? "Новый пункт" : "Редактировать пункт"}>
      <div className="filters-block">

        {serverError && (
          <div style={{
            background: "#fee2e2", color: "#b91c1c",
            padding: "10px 12px", borderRadius: "6px",
            marginBottom: "12px", fontSize: "13px"
          }}>
            {serverError}
          </div>
        )}

        <h4>Название *</h4>
        <input
          type="text"
          className={`search-input ${errors.name ? "input-error" : ""}`}
          placeholder="Эко-центр на Ленина..."
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        {errors.name && <div className="field-error">{errors.name}</div>}

        <hr />

        <h4>Адрес *</h4>
        <input
          type="text"
          className={`search-input ${errors.address ? "input-error" : ""}`}
          placeholder="ул. Ленина, 1"
          value={form.address}
          onChange={(e) => handleChange("address", e.target.value)}
        />
        {errors.address && <div className="field-error">{errors.address}</div>}

        <hr />

        <h4>Типы отходов *</h4>
        {WASTE_TYPES.map(({ label, value }) => (
          <label key={value} className="chk">
            <input
              type="checkbox"
              checked={form.waste_types.includes(value)}
              onChange={() => handleToggleWasteType(value)}
            /> {label}
          </label>
        ))}
        {errors.waste_types && <div className="field-error">{errors.waste_types}</div>}

        <hr />

        <h4>Часы работы</h4>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="time"
            className="search-input"
            style={{ flex: 1 }}
            value={form.opens_at}
            onChange={(e) => handleChange("opens_at", e.target.value)}
          />
          <span>—</span>
          <input
            type="time"
            className={`search-input ${errors.closes_at ? "input-error" : ""}`}
            style={{ flex: 1 }}
            value={form.closes_at}
            onChange={(e) => handleChange("closes_at", e.target.value)}
          />
        </div>
        {errors.closes_at && <div className="field-error">{errors.closes_at}</div>}

        <div className="filters-actions">
          <button className="btn ghost" onClick={() => navigate(-1)} disabled={saving}>
            Отмена
          </button>
          <button className="btn primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Сохранение..." : isNew ? "Создать" : "Сохранить"}
          </button>
        </div>

      </div>
    </SidebarShell>
  );
}