import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#51af8b" },
    background: {
      default: "#EEF3F0", // softer, less white
      paper: "#FFFFFF",
    },
    divider: "#d6e2dc",
    text: {
      primary: "#111827",
      secondary: "#4b5b55",
    },
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
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#4B5563",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#374151",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#374151",
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#4B5563",
          "&.Mui-focused": {
            color: "#4B5563",
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
          "&.Mui-disabled": {
            color: "#9CA3AF",
            backgroundColor: "#E5E7EB",
            opacity: 1,
          },
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
