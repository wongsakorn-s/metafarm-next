import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { AdminPage } from "./pages/AdminPage";
import { PublicPage } from "./pages/PublicPage";
import { legacyAdminDestination } from "./pages/legacyRoutes";
import "./styles.css";

registerSW({ immediate: true });

const legacyDestination = legacyAdminDestination(location.pathname);
if (legacyDestination) {
  location.replace(legacyDestination);
} else {
  createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      {location.pathname.startsWith("/admin") ? <AdminPage /> : <PublicPage />}
    </React.StrictMode>,
  );
}
