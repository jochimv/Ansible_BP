import React from 'react';

const Terminal: React.FC<{ output: string }> = ({ output }) => {
  const formattedOutput = output.replace(/\r\n/g, '\n');
  const outputLines = formattedOutput.split('\n');
  return (
    <pre
      style={{
        backgroundColor: '#000',
        color: '#fff',
        padding: '16px',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        margin: 0,
      }}
    >
      {outputLines.map((line: string, index: number) => (
        <div key={index}>{line}</div>
      ))}
    </pre>
  );
};

export default Terminal;
