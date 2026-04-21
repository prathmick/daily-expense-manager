import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { registerSW } from "virtual:pwa-register";

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New version available! Click OK to update.")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("App is ready to work offline");
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
