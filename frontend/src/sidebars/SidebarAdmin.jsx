import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SidebarShell from "../shared/SidebarShell";
import api from "../services/api";

export default function SidebarAdmin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!api.isAdmin()) {
      navigate("/sidebar/main");
      return;
    }
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError("Не удалось загрузить пользователей");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await api.changeUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingId(null);
    } catch (err) {
      alert(err.message || "Ошибка изменения роли");
    }
  }

  async function handleDelete(userId) {
    if (!window.confirm("Удалить пользователя?")) return;
    try {
      await api.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.message || "Ошибка удаления");
    }
  }

  if (loading) return <SidebarShell title="Загрузка..." />;
  if (error) return (
    <SidebarShell title="Ошибка">
      <div className="error">{error}</div>
      <button onClick={() => navigate("/sidebar/main")}>Назад</button>
    </SidebarShell>
  );

  return (
    <SidebarShell title="Управление пользователями ⚙">
      <div>
        <button className="btn ghost" onClick={() => navigate("/sidebar/main")}
          style={{ marginBottom: "15px" }}>
          ← Назад
        </button>

        {users.length === 0 ? (
          <div className="empty">Пользователей нет</div>
        ) : (
          users.map(user => (
            <div key={user.id} style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
              marginBottom: "10px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{user.username}</strong>
                  <span style={{ marginLeft: "8px", fontSize: "12px", color: "#666" }}>
                    #{user.id}
                  </span>
                  <br />
                  <span style={{ fontSize: "12px", color: "#999" }}>{user.email}</span>
                </div>

                {editingId === user.id ? (
                  <select
                    defaultValue={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    style={{ padding: "4px", borderRadius: "4px" }}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                ) : (
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    background: user.role === "admin" ? "#fff3e0" : "#e8f5e9",
                    color: user.role === "admin" ? "orange" : "green",
                  }}>
                    {user.role}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button
                  className="btn ghost"
                  style={{ fontSize: "12px", padding: "4px 10px" }}
                  onClick={() => setEditingId(editingId === user.id ? null : user.id)}
                >
                  {editingId === user.id ? "Отмена" : "Изменить роль"}
                </button>
                <button
                  className="btn"
                  style={{ fontSize: "12px", padding: "4px 10px", background: "red", color: "white" }}
                  onClick={() => handleDelete(user.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </SidebarShell>
  );
}