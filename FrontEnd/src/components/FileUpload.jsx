import { Button, Box } from '@mui/material';
import { useState, useId } from 'react';

const FileUpload = ({ label, onChange, accept, ...props }) => {
  const [fileName, setFileName] = useState('');
  const id = useId();

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      if (onChange) {
        onChange(event);
      }
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      <input
        accept={accept}
        style={{ display: 'none' }}
        id={`file-upload-${id}`}
        type="file"
        onChange={handleFileChange}
        {...props}
      />
      <label htmlFor={`file-upload-${id}`}>
        <Button
          variant="outlined"
          component="span"
          fullWidth
          sx={{ mt: 1 }}
        >
          {fileName || label || 'Upload File'}
        </Button>
      </label>
      {fileName && (
        <Box sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
          Selected: {fileName}
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
