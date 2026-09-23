import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { AppStateProvider } from "./context/AppStateContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <ToastProvider>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </ToastProvider>
    </AuthProvider>
  </StrictMode>,
);
