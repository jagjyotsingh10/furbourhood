import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Fonts are bundled locally (no CDN) so the app works offline inside Android.
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./index.css";

import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
