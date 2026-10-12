import React from "react";
import { createRoot } from "react-dom/client";

import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./app/App";
import { DemoShopGateway } from "./infrastructure/demo/demo-shop-gateway";
import { HttpShopGateway } from "./infrastructure/http/http-shop-gateway";
import { BrowserPreferences } from "./infrastructure/storage/browser-preferences";

const demo = process.env.REACT_APP_DEMO === "true";
const preferences = new BrowserPreferences(demo ? "step-demo-" : "step-");
const shop = demo ? new DemoShopGateway(preferences) : new HttpShopGateway();
const Router = demo ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App shop={shop} preferences={preferences} />
    </Router>
  </React.StrictMode>,
);
