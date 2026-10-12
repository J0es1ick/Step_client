import React, { FormEvent, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../state/StoreProvider";
import Icon from "./Icon";

export function Header() {
  const { user, favorites, cart, setCartOpen, setAuthOpen } = useStore();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
  }, [location.pathname, location.search]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/catalog?q=${encodeURIComponent(search.trim())}`);
    setMenu(false);
  };
  const openSearch = () => {
    setMenu(true);
    setTimeout(() => document.getElementById("header-search")?.focus(), 0);
  };
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  return (
    <header
      className={`site-header ${location.pathname === "/" ? "header-home" : ""}`}
    >
      <div className="container header-main">
        <button
          className="icon-button mobile-menu"
          aria-label="Меню"
          aria-expanded={menu}
          aria-controls="site-menu"
          onClick={() => setMenu(!menu)}
        >
          <Icon name={menu ? "close" : "menu"} />
        </button>
        <nav className="desktop-nav" aria-label="Основная навигация">
          <NavLink to="/catalog">Каталог</NavLink>
          <Link to="/catalog?gender=women">Женщинам</Link>
          <Link to="/catalog?gender=men">Мужчинам</Link>
        </nav>
        <Link to="/" className="logo" aria-label="STEP — на главную">
          STEP
        </Link>
        <div className="header-actions">
          {user?.role === "admin" && (
            <Link className="header-admin" to="/admin">
              Админка
            </Link>
          )}
          <button
            className="icon-button"
            aria-label="Поиск"
            aria-expanded={menu}
            aria-controls="site-menu"
            onClick={openSearch}
          >
            <Icon name="search" size={20} />
          </button>
          <button
            className={`icon-button ${user ? "signed-in" : ""}`}
            aria-label="Личный кабинет"
            onClick={() => (user ? navigate("/account") : setAuthOpen(true))}
          >
            <Icon name="user" size={20} />
          </button>
          <Link
            className="icon-button header-favorite"
            to="/favorites"
            aria-label={`Избранное, ${favorites.length}`}
          >
            <Icon name="heart" size={20} />
            {favorites.length > 0 && (
              <span className="count small-count">{favorites.length}</span>
            )}
          </Link>
          <button
            className="bag-button"
            onClick={() => setCartOpen(true)}
            aria-label={`Корзина, ${count} товаров`}
          >
            <Icon name="bag" size={20} />
            <span key={count} className="count bag-count">
              {count}
            </span>
          </button>
        </div>
      </div>
      {menu && (
        <div
          id="site-menu"
          className="header-secondary menu-is-open"
          onKeyDown={(event) => {
            if (event.key === "Escape") setMenu(false);
          }}
        >
          <div className="container secondary-inner">
            <nav aria-label="Категории">
              <Link to="/catalog">Все вещи</Link>
              <Link to="/catalog?category=sneakers">Кроссовки</Link>
              <Link to="/catalog?category=shoes">Обувь</Link>
              <Link to="/catalog?category=clothing">Одежда</Link>
              <Link to="/catalog?category=accessories">Аксессуары</Link>
              <Link to="/favorites">Избранное</Link>
              {user?.role === "admin" && <Link to="/admin">Админка</Link>}
            </nav>
            <form className="header-search" onSubmit={submit}>
              <input
                id="header-search"
                aria-label="Поиск по каталогу"
                placeholder="Название, бренд или цвет"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button aria-label="Искать" type="submit">
                <Icon name="arrow" size={19} />
              </button>
            </form>
            <button
              className="icon-button close-menu"
              aria-label="Закрыть меню"
              onClick={() => setMenu(false)}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-manifesto">
          <div>
            <span className="eyebrow">ЗАМЕТКА НА КАЖДЫЙ ДЕНЬ</span>
            <h2>
              Хорошо <em>быть собой.</em>
            </h2>
          </div>
          <Link to="/catalog" className="footer-sticker">
            Найти своё <Icon name="diagonal" size={22} />
          </Link>
        </div>
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="logo">
              STEP
            </Link>
            <p>
              Обувь, одежда и немного вдохновения.
              <br />
              Для жизни в твоём ритме.
            </p>
            <span className="footer-note">
              Маленький шаг к любимому образу.
            </span>
          </div>
          <div>
            <h3>Найти своё</h3>
            <Link to="/catalog?gender=women">Женщинам</Link>
            <Link to="/catalog?gender=men">Мужчинам</Link>
            <Link to="/catalog?new=1">Новинки</Link>
            <Link to="/catalog?sale=1">Специальные цены</Link>
          </div>
          <div>
            <h3>Мы рядом</h3>
            <Link to="/info/delivery">Доставка и оплата</Link>
            <Link to="/info/returns">Возврат и обмен</Link>
            <Link to="/info/sizes">Как выбрать размер</Link>
            <Link to="/info/about">О STEP</Link>
          </div>
          <div className="footer-callout">
            <Icon name="spark" size={32} />
            <h3>
              Хороший день
              <br />
              начинается с удобной пары.
            </h3>
            <Link to="/catalog">
              Найдём твою <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} STEP</span>
          <span>С заботой о каждом шаге</span>
          <Link to="/info/privacy">Конфиденциальность</Link>
        </div>
      </div>
    </footer>
  );
}
export function Breadcrumbs({
  items,
}: {
  items: { label: string; to?: string }[];
}) {
  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      <Link to="/">Главная</Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <Icon name="chevron" size={12} />
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
export function Empty({
  icon = "bag",
  title,
  children,
  action = "Перейти в каталог",
  to = "/catalog",
}: {
  icon?: string;
  title: string;
  children: React.ReactNode;
  action?: string;
  to?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={36} />
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      <Link className="button" to={to}>
        {action}
        <Icon name="arrow" size={18} />
      </Link>
    </div>
  );
}
