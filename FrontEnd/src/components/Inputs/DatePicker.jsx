import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

const DatePicker = ({ label, value, onChange }) => {
  return (
    <MuiDatePicker
      label={label}
      value={value ? dayjs(value) : null}
      onChange={(newValue) => {
        onChange(newValue ? newValue.format("YYYY-MM-DD") : "");
      }}
      format="DD/MM/YYYY"
      slotProps={{
        textField: {
          fullWidth: true,
          margin: "dense",
        },
      }}
    />
  );
};

export default DatePicker;
