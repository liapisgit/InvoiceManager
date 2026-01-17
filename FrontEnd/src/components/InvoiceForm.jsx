import { useState } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import TextField from './TextField';
import Checkbox from './Checkbox';
import DatePicker from './DatePicker';
import FileUpload from './FileUpload';

const InvoiceForm = ({ formIndex, onFormChange }) => {
  const [formData, setFormData] = useState({
    afm: '',
    series: '',
    number: '',
    mark: '',
    project: '',
    date: '',
    isPaid: false,
    comments: '',
    vendorName: '',
    totalPrice: '',
    files: null,
  });

  const handleChange = (field, value) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    if (onFormChange) {
      onFormChange(formIndex, updatedData);
    }
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    handleChange('files', files);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Invoice Form #{formIndex + 1}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <TextField
          label="AFM"
          value={formData.afm}
          onChange={(e) => handleChange('afm', e.target.value)}
        />
        <TextField
          label="Series"
          value={formData.series}
          onChange={(e) => handleChange('series', e.target.value)}
        />
        <TextField
          label="Number"
          value={formData.number}
          onChange={(e) => handleChange('number', e.target.value)}
        />
        <TextField
          label="Mark"
          value={formData.mark}
          onChange={(e) => handleChange('mark', e.target.value)}
        />
        <TextField
          label="Project"
          value={formData.project}
          onChange={(e) => handleChange('project', e.target.value)}
        />
        <DatePicker
          label="Date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
        />
        <Box sx={{ mt: 2, mb: 1 }}>
          <Checkbox
            label="Is Paid"
            checked={formData.isPaid}
            onChange={(e) => handleChange('isPaid', e.target.checked)}
          />
        </Box>
        <TextField
          label="Comments"
          value={formData.comments}
          onChange={(e) => handleChange('comments', e.target.value)}
          multiline
          rows={3}
        />
        <TextField
          label="Vendor Name"
          value={formData.vendorName}
          onChange={(e) => handleChange('vendorName', e.target.value)}
        />
        <TextField
          label="Total Price"
          value={formData.totalPrice}
          onChange={(e) => handleChange('totalPrice', e.target.value)}
          type="number"
        />
        <FileUpload
          label="Upload Files"
          onChange={handleFileChange}
          accept="*/*"
        />
      </Box>
    </Paper>
  );
};

export default InvoiceForm;
