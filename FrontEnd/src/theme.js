import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#F3F4F6",
      paper: "#FFFFFF",
    },
    primary: {
      main: "#2F6FED",
    },
    text: {
      primary: "#111827",
      secondary: "#4B5563",
    },
    divider: "#D1D5DB",
  },
  typography: {
    fontFamily: '"Inter","Segoe UI",system-ui,-apple-system,sans-serif',
    h5: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    subtitle1: {
      fontWeight: 600,
    },
    caption: {
      fontWeight: 500,
      color: "#6B7280",
    },
    body2: {
      color: "#111827",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: "1px solid #D1D5DB",
          borderRadius: 12,
          boxShadow: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#9CA3AF",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6B7280",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2F6FED",
            borderWidth: 2,
          },
          "&.Mui-focused": {
            boxShadow: "0 0 0 3px rgba(47, 111, 237, 0.15)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
        },
        containedPrimary: {
          boxShadow: "none",
        },
        outlined: {
          borderColor: "#D1D5DB",
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          border: "1px solid #D1D5DB",
          borderRadius: 999,
          padding: 2,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: "none",
          borderRadius: 999,
          minWidth: 34,
          padding: "2px 8px",
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "#4B5563",
          "&.Mui-selected": {
            color: "#2F6FED",
            backgroundColor: "#EEF2FF",
          },
        },
      },
    },
  },
});

export default theme;
