/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import React from 'react';
import { Dialog } from '@mui/material';
import { Terminal } from '@frontend/components/Terminal';

interface TerminalModalProps {
  output: string;
  open: boolean;
  onClose: () => void;
}
const TerminalDialog = ({ output, open, onClose }: TerminalModalProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Terminal output={output} />
    </Dialog>
  );
};

export default TerminalDialog;
