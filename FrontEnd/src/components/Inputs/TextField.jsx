import { TextField as MuiTextField } from '@mui/material';

const TextField = ({ label, value, onChange, type = 'text', ...props }) => {
  return (
    <MuiTextField
      label={label}
      value={value}
      onChange={onChange}
      type={type}
      variant="outlined"
      fullWidth
      margin="dense"
      slotProps={{
        textField: {
          InputLabelProps: { shrink: true },
        },
      }}
      {...props}
    />
  );
};

export default TextField;
