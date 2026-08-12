import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { messages } from "../locales/en/messages.po";
import App from "./App";
import "./styles/global.css";

i18n.load("en", messages);
i18n.activate("en");

const root = document.getElementById("root");
if (!root) throw new Error("No #root");

createRoot(root).render(
  <StrictMode>
    <I18nProvider i18n={i18n}>
      <App />
    </I18nProvider>
  </StrictMode>,
);
