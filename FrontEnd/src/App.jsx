import { useState } from 'react';
import { Container, Button, Box, Typography, Snackbar, Alert } from '@mui/material';
import InvoiceForm from './components/InvoiceForm';
import './App.css';

function App() {
  const [forms, setForms] = useState([{}]);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddNew = () => {
    setForms([...forms, {}]);
  };

  const handleFormChange = (index, formData) => {
    const updatedForms = [...forms];
    updatedForms[index] = formData;
    setForms(updatedForms);
  };

  const handleComplete = () => {
    // Here you can add validation or submission logic
    console.log('All forms data:', forms);
    setShowSuccess(true);
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Invoice Manager
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {forms.map((form, index) => (
          <InvoiceForm
            key={index}
            formIndex={index}
            onFormChange={handleFormChange}
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddNew}
          size="large"
        >
          Add New
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleComplete}
          size="large"
        >
          Complete
        </Button>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
          Forms completed successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;
