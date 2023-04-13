import { Snackbar as MuiSnackbar, IconButton, Alert, AlertColor } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface SnackbarProps {
  message: string;
  severity: AlertColor;
  onClose: () => void;
}

const Snackbar = ({ message, severity, onClose }: SnackbarProps) => {
  return (
    <MuiSnackbar open={!!message} autoHideDuration={5000} onClose={onClose}>
      <Alert
        severity={severity}
        action={
          <IconButton size="small" color="inherit" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </Alert>
    </MuiSnackbar>
  );
};

export default Snackbar;
