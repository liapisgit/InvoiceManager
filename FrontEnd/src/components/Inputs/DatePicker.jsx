import { TextField as MuiTextField } from '@mui/material';

const DatePicker = ({ label, value, onChange, placeholder = "dd/mm/yyyy", ...props }) => {
  return (
    <MuiTextField
      label={label}
      type="text"
      value={value}
      onChange={onChange}
      variant="outlined"
      fullWidth
      margin="dense"
      InputLabelProps={{
        shrink: true,
      }}
      inputProps={{
        inputMode: "numeric",
        placeholder,
      }}
      {...props}
    />
  );
};

export default DatePicker;
