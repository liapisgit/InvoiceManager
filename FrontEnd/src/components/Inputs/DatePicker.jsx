import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

const DatePicker = ({ label, value, onChange, onBlur, error, helperText, size = "small" }) => {
  return (
    <MuiDatePicker
      label={label}
      value={value ? dayjs(value, "YYYY-MM-DD") : null}
      onChange={(newValue) => {
        onChange(newValue ? newValue.format("YYYY-MM-DD") : "");
      }}
      format="DD/MM/YYYY"
      slotProps={{
        textField: {
          fullWidth: true,
          margin: "dense",
          size,
          variant: "outlined",
          onBlur,
          error,
          helperText,
          InputLabelProps: { shrink: true },
        },
        openPickerButton: { size: "small" },
        openPickerIcon: { fontSize: "small" },
      }}
    />
  );
};

export default DatePicker;