import {
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function AppHeader({
  actions,
  disabled = false,
  showPasswordAction = true,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lang", language);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 56,
        px: 3,
        py: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
        bgcolor: "#51af8b",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>
        {t("app.title")}
      </Typography>

      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <ToggleButtonGroup
          size="small"
          value={i18n.language}
          exclusive
          onChange={(_, value) => value && handleLanguageChange(value)}
          disabled={disabled}
          sx={{
            "& .MuiToggleButton-root": {
              fontSize: 13,
              borderColor: "rgba(255,255,255,0.45)",
              minWidth: 34,
              px: 1,
              py: 0.25,
              color: "#fff",
            },
            "& .Mui-selected": {
              backgroundColor: "rgba(255,255,255,0.22)",
              color: "#fff",
            },
          }}
        >
          <ToggleButton value="el">EL</ToggleButton>
          <ToggleButton value="en">EN</ToggleButton>
        </ToggleButtonGroup>
        {showPasswordAction ? (
          <Button
            variant="outlined"
            onClick={() => navigate("/account/password")}
            disabled={disabled}
            startIcon={<LockResetIcon />}
            sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.45)" }}
          >
            {t("password.changePassword")}
          </Button>
        ) : null}
        {actions}
      </Box>
    </Box>
  );
}
