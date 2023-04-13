import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import { CloseButton } from '@frontend/components/CloseButton';
import DoneIcon from '@mui/icons-material/Done';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<DoneIcon />} color="success" onClick={onConfirm}>
          Yes
        </Button>
        <CloseButton onClick={onClose} autoFocus>
          No
        </CloseButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
