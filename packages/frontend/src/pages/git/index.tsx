import { DiffEditor } from '@monaco-editor/react';
import { Stack, Typography, Button } from '@mui/material';
import { Replay as ReplayIcon, Send as SendIcon } from '@mui/icons-material';
import { useCodeChangesContext, useCodeChangesDispatchContext } from '../../context/context';
import { useEffect } from 'react';
import { createDiff, rollback } from '../../context/reducer';
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
          <Stack direction="column">
            <Stack direction="row">
              <Button startIcon={<SendIcon />} color="success">
                Commit
              </Button>
              <Button
                startIcon={<ReplayIcon />}
                color="error"
                onClick={() => dispatch(rollback(newDiff))}
              >
                Rollback
              </Button>
            </Stack>
            <FileTree />
          </Stack>
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
