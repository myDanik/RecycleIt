import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SidebarShell from "../shared/SidebarShell";
import api from "../services/api";

export default function SidebarFeedback() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submitFeedback(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const user = api.getCurrentUser();
  if (!user) {
    navigate("/sidebar/login");
    return;
  }

    try {
      await api.createFeedback({
        point_id: parseInt(id),
        message,
        rating
      });
      navigate(`/sidebar/info/${id}`);
    } catch (err) {
      if (err.status === 403) {
      setError("Недостаточно прав для отправки отзыва");
      } else {
      setError("Ошибка отправки отзыва");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SidebarShell title="Оставить отзыв">
      {error && <div className="error" style={{ marginBottom: "10px" }}>{error}</div>}
      
      <form onSubmit={submitFeedback}>
        <div style={{ marginBottom: "10px" }}>
          <label>Оценка:</label>
          <select 
            value={rating} 
            onChange={(e) => setRating(parseInt(e.target.value))}
            style={{ marginLeft: "10px" }}
          >
            {[1,2,3,4,5].map(num => (
              <option key={num} value={num}>{num} звезд{num === 1 ? 'а' : num === 5 ? '' : 'ы'}</option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: "10px" }}>
          <label>Сообщение:</label>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ваш отзыв..."
            rows={4}
            style={{ width: "100%", marginTop: "5px" }}
            required
          />
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            type="button" 
            onClick={() => navigate(`/sidebar/info/${id}`)}
            disabled={loading}
          >
            Отмена
          </button>
          <button type="submit" disabled={loading}>
            {loading ? "Отправка..." : "Отправить"}
          </button>
        </div>
      </form>
    </SidebarShell>
  );
}