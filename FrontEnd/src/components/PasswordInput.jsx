import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useTranslation } from "react-i18next";

import { generatePassword } from "../utils/password";

export default function PasswordInput({
  label,
  value,
  onChange,
  onGenerate,
  canGenerate = false,
  disabled = false,
  error = false,
  helperText = "",
  required = false,
  autoComplete = "new-password",
}) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const handleGenerate = () => {
    const password = generatePassword();
    onChange(password);
    onGenerate?.(password);
    setShowPassword(true);
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        alignItems: "flex-start",
        flexWrap: "wrap",
      }}
    >
      <TextField
        label={label}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        error={error}
        helperText={helperText}
        required={required}
        autoComplete={autoComplete}
        size="small"
        fullWidth
        sx={{ flex: "1 1 220px" }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((current) => !current)}
                  edge="end"
                  aria-label={t(
                    showPassword
                      ? "password.hidePassword"
                      : "password.showPassword",
                  )}
                  disabled={disabled}
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      {canGenerate ? (
        <Button
          variant="outlined"
          onClick={handleGenerate}
          disabled={disabled}
          startIcon={<AutorenewIcon />}
          sx={{ minWidth: "max-content", minHeight: 40 }}
        >
          {t("password.generate")}
        </Button>
      ) : null}
    </Box>
  );
}
