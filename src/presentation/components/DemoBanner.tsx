import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { errorText } from "../../application/errors";
import { useStore } from "../state/StoreProvider";

export function DemoAccess() {
  const { shop, signIn, notify } = useStore();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const enter = async (role: "customer" | "admin") => {
    if (!shop.preview) return;
    setBusy(true);
    try {
      await signIn(await shop.preview.enter(role));
      navigate(role === "admin" ? "/admin" : "/account");
    } catch (error) {
      notify(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="demo-access">
      <p>Выбери готовый профиль. Email и пароль не нужны.</p>
      <button
        className="button full-width"
        disabled={busy}
        onClick={() => enter("customer")}
      >
        Я покупатель ↗
      </button>
      <button
        className="button button-outline full-width"
        disabled={busy}
        onClick={() => enter("admin")}
      >
        Посмотреть админку ↗
      </button>
    </div>
  );
}
export default function DemoBanner() {
  const { shop, user, setAuthOpen, resetDemo, notify } = useStore();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  if (!shop.preview) return null;
  return (
    <aside className="demo-banner" aria-label="Демонстрационный режим">
      <span>
        <strong>STEP / PLAYGROUND</strong> Пет-проект для души. Заказы учебные,
        изменения только в этом браузере.
      </span>
      <div>
        <button onClick={() => setAuthOpen(true)}>
          {user?.role === "admin"
            ? "Администратор"
            : user
              ? "Покупатель"
              : "Выбрать роль"}{" "}
          ↗
        </button>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await resetDemo();
              navigate("/");
            } catch (error) {
              notify(errorText(error));
            } finally {
              setBusy(false);
            }
          }}
        >
          Сбросить демо
        </button>
      </div>
    </aside>
  );
}
