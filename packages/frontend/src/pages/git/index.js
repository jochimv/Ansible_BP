import { DiffEditor } from '@monaco-editor/react';
import { Stack } from '@mui/material';

const GitPage = () => {
  return (
    <Stack>
      <DiffEditor readOnly defaultLanguage="yml" />
    </Stack>
  );
};

export default GitPage;
