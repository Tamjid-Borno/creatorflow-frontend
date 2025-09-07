// src/index.js
import "./styles/globals.css";
import "./styles/cosmic.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { setupPerfFlags } from "./utils/perf";
import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/saga-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { DeviceProvider } from "./contexts/DeviceContext";

// ✅ Force dark variables (uses your existing `.dark { ... }` block)
document.documentElement.classList.add("dark");
setupPerfFlags();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <DeviceProvider>
      <PrimeReactProvider>
        <React.Suspense fallback={null}>
        <App />
      </React.Suspense>
      </PrimeReactProvider>
    </DeviceProvider>
  </React.StrictMode>
);
