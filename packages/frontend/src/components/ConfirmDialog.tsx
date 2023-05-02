/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { CloseButton } from '@frontend/components/CloseButton';
import ConfirmButton from '@frontend/components/ConfirmButton';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmDialog = ({ open, onClose, onConfirm, title, message }: ConfirmDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <ConfirmButton onClick={onConfirm}>Yes</ConfirmButton>
        <CloseButton onClick={onClose} autoFocus>
          No
        </CloseButton>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
