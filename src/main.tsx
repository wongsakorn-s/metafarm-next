import React, { lazy, Suspense } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { PublicPage } from "./pages/PublicPage";
import { legacyAdminDestination } from "./pages/legacyRoutes";
import { th } from "./i18n/th";
import "./styles.css";

const AdminPage = lazy(() => import("./pages/AdminPage").then((module) => ({ default: module.AdminPage })));
const QRRedirectPage = lazy(() => import("./pages/QRRedirectPage").then((module) => ({ default: module.QRRedirectPage })));

registerSW({ immediate: true });

const legacyDestination = legacyAdminDestination(location.pathname);
if (legacyDestination) {
  location.replace(legacyDestination);
} else {
  const root = document.getElementById("root")!;
  const isAdmin = location.pathname.startsWith("/admin");
  const app = (
    <React.StrictMode>
      {isAdmin ? (
        <Suspense fallback={<div className="p-6" role="status">{th.common.loading}</div>}>
          {location.pathname.startsWith("/admin/qr/") ? <QRRedirectPage /> : <AdminPage />}
        </Suspense>
      ) : <PublicPage />}
    </React.StrictMode>
  );
  if (root.hasChildNodes() && !isAdmin) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
