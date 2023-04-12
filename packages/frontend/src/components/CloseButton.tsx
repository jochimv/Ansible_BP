import { Button, ButtonProps } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import React from 'react';

export const CloseButton = ({ children, ...other }: ButtonProps) => (
  <Button {...other} color="error" startIcon={<CloseIcon />}>
    {children}
  </Button>
);
