import { DiffEditor } from '@monaco-editor/react';
import { Stack, Typography, StackProps } from '@mui/material';
import { ResponsiveStyleValue } from '@mui/system';
import { useCodeChangesContext, useCodeChangesDispatchContext } from '../../context/context';
import { useEffect } from 'react';
import { createDiff } from '../../context/reducer';
import FileTree from '../../components/FileTree';

const stackPropsIfNoChanges = {
  alignItems: 'center',
  justifyContent: 'center',
};
const GitPage = () => {
  const dispatch = useCodeChangesDispatchContext();
  const { oldDiff, newDiff, oldVars, newVars } = useCodeChangesContext();
  useEffect(() => {
    dispatch(createDiff());
  }, []);
  return (
    <Stack direction="row" flexGrow={1} height="100%" {...(oldDiff ? {} : stackPropsIfNoChanges)}>
      {oldDiff ? (
        <>
          <FileTree />
          <DiffEditor
            language="yml"
            original={oldDiff?.values}
            modified={newDiff?.values}
            height="500px"
            options={{ readOnly: true }}
          />
        </>
      ) : (
        <Typography variant="h3">No changes</Typography>
      )}
    </Stack>
  );
};

export default GitPage;
