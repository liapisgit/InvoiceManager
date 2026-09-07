import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import LockResetIcon from "@mui/icons-material/LockReset";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  getTokenPayload,
  getUserFullNameFromToken,
  isAdmin,
} from "../../services/auth";

export default function AppHeader({
  actions,
  navigation,
  primaryAction,
  onRefresh,
  refreshing = false,
  onLogout,
  disabled = false,
  showPasswordAction = true,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [accountAnchor, setAccountAnchor] = useState(null);
  const tokenPayload = getTokenPayload();
  const userName =
    getUserFullNameFromToken() || tokenPayload?.user_name || "Account";
  const initials = userName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const handleLanguageChange = (language) => {
    i18n.changeLanguage(language);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lang", language);
    }
  };

  return (
    <Box
      component="header"
      sx={{
        minHeight: 62,
        px: { xs: 1.5, md: 2.5 },
        py: 0.75,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: { xs: 1, md: 2 },
        bgcolor: "#51af8b",
        borderBottom: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 2px 12px rgba(20, 76, 60, 0.12)",
      }}
    >
      <Typography
        sx={{
          order: 1,
          mr: { md: 1 },
          fontSize: 14,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {t("app.title")}
      </Typography>

      {navigation ? (
        <Box
          component="nav"
          sx={{
            order: { xs: 3, md: 2 },
            display: "flex",
            alignItems: "center",
            flex: 1,
            minWidth: 0,
            width: { xs: "100%", md: "auto" },
            gap: 0.25,
            overflowX: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {navigation}
        </Box>
      ) : null}

      <Box
        sx={{
          order: { xs: 2, md: 3 },
          display: "flex",
          gap: 0.75,
          alignItems: "center",
          justifyContent: "flex-end",
          ml: "auto",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <ToggleButtonGroup
          size="small"
          value={i18n.language}
          exclusive
          onChange={(_, value) => value && handleLanguageChange(value)}
          disabled={disabled}
          sx={{
            bgcolor: "rgba(255,255,255,0.10)",
            borderColor: "rgba(255,255,255,0.18)",
            "& .MuiToggleButton-root": {
              fontSize: 11,
              border: 0,
              minWidth: 29,
              px: 0.75,
              py: 0.2,
              color: "#fff",
            },
            "& .MuiToggleButton-root.Mui-selected": {
              backgroundColor: "#fff",
              color: "#246d59",
            },
          }}
        >
          <ToggleButton value="el">EL</ToggleButton>
          <ToggleButton value="en">EN</ToggleButton>
        </ToggleButtonGroup>

        {onRefresh ? (
          <Tooltip title={t("dashboard.refresh")}>
            <span>
              <IconButton
                onClick={onRefresh}
                disabled={disabled || refreshing}
                aria-label={t("dashboard.refresh")}
                sx={{
                  width: 34,
                  height: 34,
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.20)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
                }}
              >
                <RefreshIcon
                  fontSize="small"
                  sx={{
                    animation: refreshing
                      ? "header-spin 0.9s linear infinite"
                      : "none",
                    "@keyframes header-spin": {
                      to: { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        ) : null}

        {primaryAction}

        {onLogout ? (
          <>
            <Button
              onClick={(event) => setAccountAnchor(event.currentTarget)}
              disabled={disabled}
              endIcon={<ExpandMoreIcon />}
              aria-haspopup="menu"
              aria-expanded={Boolean(accountAnchor)}
              sx={{
                minWidth: 0,
                maxWidth: 150,
                px: 0.75,
                color: "#fff",
                "&:hover": { bgcolor: "rgba(255,255,255,0.10)" },
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  mr: 0.75,
                  bgcolor: "#fff",
                  color: "#246d59",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {initials || "U"}
              </Avatar>
              <Typography
                component="span"
                sx={{
                  maxWidth: 82,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {userName}
              </Typography>
            </Button>
            <Menu
              anchorEl={accountAnchor}
              open={Boolean(accountAnchor)}
              onClose={() => setAccountAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 0.75,
                    minWidth: 210,
                    borderRadius: 2.5,
                    boxShadow: "0 12px 32px rgba(20, 55, 45, 0.18)",
                  },
                },
              }}
            >
              <Box sx={{ px: 2, pt: 1, pb: 1.25 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: "text.primary" }}
                >
                  {userName}
                </Typography>
              </Box>
              <Divider />
              {isAdmin() ? (
                <MenuItem
                  onClick={() => {
                    setAccountAnchor(null);
                    navigate("/settings");
                  }}
                >
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  {t("admin.navLabel")}
                </MenuItem>
              ) : null}
              <MenuItem
                onClick={() => {
                  setAccountAnchor(null);
                  navigate("/account/password");
                }}
              >
                <ListItemIcon>
                  <LockResetIcon fontSize="small" />
                </ListItemIcon>
                {t("password.changePassword")}
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  setAccountAnchor(null);
                  onLogout();
                }}
                sx={{ color: "error.main" }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                {t("app.logout")}
              </MenuItem>
            </Menu>
          </>
        ) : showPasswordAction ? (
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
