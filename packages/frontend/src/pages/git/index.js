import { DiffEditor } from '@monaco-editor/react';
import { Stack } from '@mui/material';
import { useCodeChangesContext, useCodeChangesDispatchContext } from '../../context/context';
import { useEffect } from 'react';
import { createDiff } from '../../context/reducer';
import FileTree from '../../components/FileTree';

const GitPage = () => {
  const dispatch = useCodeChangesDispatchContext();
  const { oldDiff, newDiff, oldVars, newVars } = useCodeChangesContext();

  useEffect(() => {
    dispatch(createDiff());
  }, []);
  return (
    <Stack direction="row">
      <FileTree />
      <DiffEditor
        defaultLanguage="yml"
        original={oldDiff?.values}
        modified={newDiff?.values}
        height="500px"
        options={{ readOnly: true }}
      />
    </Stack>
  );
};

export default GitPage;
