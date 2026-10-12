import "../presentation/styles/index.css";
import React, { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Preferences } from "../application/ports/preferences";
import { ShopGateway } from "../application/ports/shop-gateway";
import AuthModal from "../presentation/components/Auth";
import DemoBanner from "../presentation/components/DemoBanner";
import Icon from "../presentation/components/Icon";
import { Empty, Footer, Header } from "../presentation/components/Layout";
import { useShopMotion } from "../presentation/hooks/useShopMotion";
import Account from "../presentation/pages/Account";
import Admin from "../presentation/pages/Admin";
import Cart, { CartDrawer } from "../presentation/pages/Cart";
import Catalog, { Favorites } from "../presentation/pages/Catalog";
import Home from "../presentation/pages/Home";
import Info from "../presentation/pages/Info";
import ProductPage, { QuickView } from "../presentation/pages/Product";
import { StoreProvider, useStore } from "../presentation/state/StoreProvider";

function ShopRoutes() {
  useShopMotion();
  const location = useLocation();
  const { toast } = useStore();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);
  useEffect(() => {
    const titles: Record<string, string> = {
      "/": "В твоём ритме",
      "/catalog": "Каталог",
      "/cart": "Корзина",
      "/account": "Личный кабинет",
      "/favorites": "Избранное",
      "/admin": "Управление магазином",
    };
    document.title = `${titles[location.pathname] || "Обувь и одежда"} — STEP`;
  }, [location.pathname]);
  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
          document.getElementById("main")?.scrollIntoView();
        }}
      >
        К содержимому
      </a>
      <DemoBanner />
      <Header />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/info/:slug" element={<Info />} />
          <Route
            path="*"
            element={
              <div className="container page-content">
                <Empty
                  title="Кажется, мы свернули не туда"
                  action="На главную"
                  to="/"
                >
                  Такой страницы нет. Вернёмся к любимым вещам?
                </Empty>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
      <QuickView />
      <CartDrawer />
      <AuthModal />
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
export default function App({
  shop,
  preferences,
}: {
  shop: ShopGateway;
  preferences: Preferences;
}) {
  return (
    <StoreProvider shop={shop} preferences={preferences}>
      <ShopRoutes />
    </StoreProvider>
  );
}
