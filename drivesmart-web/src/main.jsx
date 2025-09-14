import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import App from "./App.jsx";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/lib/theme";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system">
      <App />
      <Toaster position="top-right" />
    </ThemeProvider>
  </React.StrictMode>
);
