import React from 'react';
import { Dialog, styled } from '@mui/material';

const StyledPre = styled('pre')({
  backgroundColor: '#000',
  color: '#fff',
  padding: '16px',
  borderRadius: '4px',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  margin: 0,
});

interface TerminalModalProps {
  output: string;
  open: boolean;
  onClose: () => void;
}
const TerminalDialog = ({ output, open, onClose }: TerminalModalProps) => {
  const formattedOutput = output.replace(/\r\n/g, '\n');
  const outputLines = formattedOutput.split('\n');
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledPre id="terminal">
        {outputLines.map((line: string, index: number) => (
          <div key={index}>{line}</div>
        ))}
      </StyledPre>
    </Dialog>
  );
};

export default TerminalDialog;
