import React from 'react';
import { styled } from '@mui/material';

const StyledPre = styled('pre')({
  backgroundColor: '#000',
  color: '#fff',
  padding: '16px',
  borderRadius: '4px',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word',
  margin: 0,
});

const Terminal: React.FC<{ output: string }> = ({ output }) => {
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

export default Terminal;
