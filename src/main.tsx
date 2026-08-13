// Copyright (c) 2026 TylerR909. All Rights Reserved.
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { hydratePi } from "./data/pi-digits";
import { activateLocale, loadStoredLocale } from "./i18n";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("No #root");

async function boot() {
  const locale = loadStoredLocale();
  // 5k digits are already in the bundle — don't wait on the 1MB stream
  await activateLocale(locale);
  void hydratePi();

  createRoot(root!).render(
    <StrictMode>
      <I18nProvider i18n={i18n}>
        <App />
      </I18nProvider>
    </StrictMode>,
  );
}

boot().catch((err) => {
  console.error("Failed to boot", err);
  root.textContent = "Failed to load. Check the console.";
});
