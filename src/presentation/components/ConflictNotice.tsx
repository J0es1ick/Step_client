import React, { useState } from "react";
import { errorText } from "../../application/errors";

export default function ConflictNotice({
  reload,
}: {
  reload: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="form-error" role="alert">
      <p>
        Товар изменился. Изменения не сохранены. Загрузи свежую версию товара и
        внеси их повторно.
      </p>
      <button
        type="button"
        className="button button-light"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await reload();
          } catch (e) {
            setError(errorText(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Загружаем…" : "Загрузить свежие данные"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
