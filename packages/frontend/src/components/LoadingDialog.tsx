import { CircularProgress, Dialog, DialogContent, DialogTitle, Stack } from '@mui/material';
import React from 'react';

const LoadingDialog = (props: any) => (
  <Dialog {...props}>
    <DialogTitle>Loading details</DialogTitle>
    <DialogContent>
      <Stack alignItems="center" justifyContent="center">
        <CircularProgress size={70} />
      </Stack>
    </DialogContent>
  </Dialog>
);

export default LoadingDialog;
