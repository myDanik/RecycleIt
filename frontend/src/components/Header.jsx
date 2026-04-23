import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

export default function Header({ onSearchChange }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("access_token"));
  const navigate = useNavigate();
  const { search } = useLocation();

  const isAdmin = api.isAdmin();

  function handleLogout() {
    api.logout()
    setIsLoggedIn(false);
    window.location.reload();
  }

  function openSearch() {
    setIsSearchOpen(true);
    navigate("/sidebar/main");
  }

  function updateQuery(e) {
    const value = e.target.value;
    setQuery(value);
    onSearchChange(value);
  }

  function closeSearch() {
    setIsSearchOpen(false);
    setQuery("");
    onSearchChange("");
  }

  function onSearchKeyDown(e) {
    if (e.key === "Enter") {
      navigate("/sidebar/main");
    } else if (e.key === "Escape") {
      closeSearch();
    }
  }

  return (
    <header className="topbar" role="banner">
      <div className="brand">
        <div className="logo">Recycle it ♻</div>
      </div>

      <div className="controls" role="navigation" aria-label="Site controls">
        {isSearchOpen ? (
          <div className="search-wrapper">
            <input
              autoFocus
              type="text"
              className="search-input"
              placeholder="Поиск по названию или адресу..."
              value={query}
              onChange={updateQuery}
              onKeyDown={onSearchKeyDown}
              aria-label="Поиск пунктов"
            />

            <button
              className="control-btn"
              onClick={closeSearch}
              aria-label="Закрыть поиск"
              title="Закрыть"
            >
              ✕
            </button>
          </div>
        ) : (
          <>

            <Link to="/sidebar/main" className="control-btn" aria-label="Открыть список">
              Список ☰
            </Link>

            <Link to={{ pathname: "/sidebar/filters", search }} className="control-btn" aria-label="Открыть фильтры">
              Фильтры
            </Link>

            {isAdmin && (
            <Link to="/sidebar/admin" className="control-btn">
              Управление
            </Link>
            )}

            {isLoggedIn ? (
              <button className="control-btn" onClick={handleLogout} aria-label="Выйти">
                Выйти
              </button>
            ) : (
              <Link to="/sidebar/login" className="control-btn" aria-label="Войти или зарегистрироваться">
                Войти
              </Link>
            )}
            
          </>
        )}
      </div>
    </header>
  );
}