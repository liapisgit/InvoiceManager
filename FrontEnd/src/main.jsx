import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import "./index.css";
import "./i18n";
import App from "./App.jsx";
import theme from "./theme";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
      <App />
      </LocalizationProvider>
    </ThemeProvider>
  </StrictMode>,
);
