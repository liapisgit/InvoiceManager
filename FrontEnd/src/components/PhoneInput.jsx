import { InputAdornment, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  isLocalPhoneValid,
  PHONE_LOCAL_LENGTH,
  PHONE_PREFIX,
  sanitizeLocalPhone,
} from "../utils/phone";

// Phone input with a fixed 30 prefix; value/onChange use the local part only
export default function PhoneInput({ label, value, onChange, disabled }) {
  const { t } = useTranslation();
  const isValid = isLocalPhoneValid(value);

  return (
    <TextField
      label={label}
      value={value}
      onChange={(event) => onChange(sanitizeLocalPhone(event.target.value))}
      disabled={disabled}
      error={!isValid}
      helperText={
        isValid
          ? undefined
          : t("admin.phoneInvalid", {
              defaultValue: "Enter {{count}} digits after +30",
              count: PHONE_LOCAL_LENGTH,
            })
      }
      size="small"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">+{PHONE_PREFIX}</InputAdornment>
          ),
        },
        htmlInput: {
          inputMode: "numeric",
          maxLength: PHONE_LOCAL_LENGTH,
        },
      }}
    />
  );
}
