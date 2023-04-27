import { Snackbar as MuiSnackbar, IconButton, Alert, AlertColor, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ReactNode } from 'react';

interface SnackbarProps {
  message: string;
  severity: AlertColor;
  onClose: () => void;
  action?: ReactNode;
  open: boolean;
}

const Snackbar = ({ message, severity, onClose, action, open }: SnackbarProps) => {
  return (
    <MuiSnackbar
      sx={{ alignItems: 'center', justifyContent: 'center' }}
      open={open}
      autoHideDuration={5000}
      onClose={(event, reason) => {
        if (reason === 'clickaway') return;
        onClose();
      }}
    >
      <Alert
        severity={severity}
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
        action={
          action ?? (
            <IconButton size="small" color="inherit" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )
        }
      >
        {message}
      </Alert>
    </MuiSnackbar>
  );
};

export default Snackbar;
