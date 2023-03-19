import { DiffEditor } from '@monaco-editor/react';
import { Stack, Typography, Button } from '@mui/material';
import {
  Replay as ReplayIcon,
  Send as SendIcon,
  CodeOff as CodeOffIcon,
} from '@mui/icons-material';
import { useCodeChangesContext, useCodeChangesDispatchContext } from '../../context/context';
import { useEffect, useState } from 'react';
import { createDiff, rollback } from '../../context/reducer';
import FileTree from '../../components/FileTree';
import CommitModal from '@frontend/components/CommitModal';

const stackPropsIfNoChanges = {
  alignItems: 'center',
  justifyContent: 'center',
};
const GitPage = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const dispatch = useCodeChangesDispatchContext();
  const { originalDiff, newDiff } = useCodeChangesContext();
  useEffect(() => {
    dispatch(createDiff());
  }, []);
  return (
    <Stack
      direction="row"
      flexGrow={1}
      height="100%"
      {...(originalDiff ? {} : stackPropsIfNoChanges)}
    >
      {originalDiff ? (
        <>
          <Stack direction="column">
            <Stack direction="row">
              <CommitModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
              <Button startIcon={<SendIcon />} color="success" onClick={() => setIsModalOpen(true)}>
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
            original={originalDiff?.values}
            modified={newDiff?.values}
            height="500px"
            options={{ readOnly: true }}
          />
        </>
      ) : (
        <Stack direction="column" alignItems="center">
          <CodeOffIcon sx={{ width: 50, height: 50 }} />
          <Typography variant="h3">No changes</Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default GitPage;
