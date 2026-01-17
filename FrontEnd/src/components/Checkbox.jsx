import { FormControlLabel, Checkbox as MuiCheckbox } from '@mui/material';

const Checkbox = ({ label, checked, onChange, ...props }) => {
  return (
    <FormControlLabel
      control={
        <MuiCheckbox
          checked={checked}
          onChange={onChange}
          {...props}
        />
      }
      label={label}
    />
  );
};

export default Checkbox;
