import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarShell from "../shared/SidebarShell";
import api from "../services/api";

export default function SidebarAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const result = await api.login({
          username: formData.username,
          password: formData.password,
        });
        api.login()
        alert("Вход выполнен успешно!");
      } else {
        await api.register(formData);
        alert("Регистрация успешна! Теперь вы можете войти.");
        setIsLogin(true)
        return;
      }
      
      window.location.reload();
      navigate("/sidebar/main");
    } catch (err) {
      setError(err.message || (isLogin ? "Ошибка входа" : "Ошибка регистрации"));
    } finally {
      setLoading(false);
    } 
  };

  return (
    <SidebarShell title={isLogin ? "Вход" : "Регистрация"}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error" style={{ marginBottom: "10px" }}>{error}</div>}
        
        <div style={{ marginBottom: "10px" }}>
          <label>Имя пользователя:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            style={{ width: "100%", padding: "5px" }}
            required
          />
        </div>
        
        {!isLogin && (
          <div style={{ marginBottom: "10px" }}>
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{ width: "100%", padding: "5px" }}
              required
            />
          </div>
        )}
        
        <div style={{ marginBottom: "10px" }}>
          <label>Пароль:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={{ width: "100%", padding: "5px" }}
            required
          />
        </div>
        
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button 
            className="btn ghost"
            type="button" 
            onClick={() => navigate("/sidebar/main")}
            disabled={loading}
          >
            Отмена
          </button>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? (isLogin ? "Вход..." : "Регистрация...") : (isLogin ? "Войти" : "Зарегистрироваться")}
          </button>
        </div>
        
        <div style={{ marginTop: "15px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({ username: "", email: "", password: "" });
              setError(null);
            }}
            style={{ background: "none", border: "none", color: "#1976d2", cursor: "pointer" }}
          >
            {isLogin ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
          </button>
        </div>
      </form>
    </SidebarShell>
  );
}