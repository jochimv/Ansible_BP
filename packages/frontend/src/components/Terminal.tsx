import { styled } from '@mui/material';
import React from 'react';

const StyledPre = styled('pre')({
  backgroundColor: '#000',
  color: '#fff',
  padding: '16px',
  borderRadius: '4px',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  margin: 0,
});

interface TerminalProps {
  output: string;
}

export const Terminal = ({ output }: TerminalProps) => {
  const formattedOutput = output.replace(/\r\n/g, '\n');
  const outputLines = formattedOutput.split('\n');
  return (
    <StyledPre id="terminal">
      {outputLines.map((line: string, index: number) => (
        <div key={index}>{line}</div>
      ))}
    </StyledPre>
  );
};
