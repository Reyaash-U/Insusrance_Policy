import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";

import store from "./store/store.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { NotificationProvider } from "./context/NotificationContext.jsx";
import App from "./App.jsx";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <App />
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={10}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background:  "rgba(13,13,36,0.95)",
                    color:       "#f1f5f9",
                    border:      "1px solid rgba(255,255,255,0.08)",
                    borderRadius:"0.75rem",
                    backdropFilter: "blur(16px)",
                    fontSize:    "0.875rem",
                    fontFamily:  "Inter, sans-serif",
                  },
                  success: {
                    iconTheme: { primary: "#10b981", secondary: "#f1f5f9" },
                  },
                  error: {
                    iconTheme: { primary: "#ef4444", secondary: "#f1f5f9" },
                  },
                }}
              />
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
