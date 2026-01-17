import { TextField as MuiTextField } from '@mui/material';

const DatePicker = ({ label, value, onChange, ...props }) => {
  return (
    <MuiTextField
      label={label}
      type="date"
      value={value}
      onChange={onChange}
      variant="outlined"
      fullWidth
      margin="normal"
      InputLabelProps={{
        shrink: true,
      }}
      {...props}
    />
  );
};

export default DatePicker;
