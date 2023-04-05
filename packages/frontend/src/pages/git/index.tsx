import { DiffEditor } from '@monaco-editor/react';
import { Stack, Typography, Button } from '@mui/material';
import {
  Replay as ReplayIcon,
  CodeOff as CodeOffIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '../../codeChanges/CodeChangesContext';
import React, { useEffect } from 'react';
import { createDiff, rollback } from '../../codeChanges/codeChangesReducer';
import GitChangesFileTree from '../../components/GitChangesFileTree';
import CommitModal from '@frontend/components/CommitModal/CommitModal';
import { open } from '@frontend/components/CommitModal/state/commitModalReducer';
import {
  useCommitModalContext,
  useCommitModalDispatchContext,
} from '@frontend/components/CommitModal/state/CommitModalContext';
import CommitModalProvider from '@frontend/components/CommitModal/state/CommitModalProvider';

const stackPropsIfNoChanges = {
  alignItems: 'center',
  justifyContent: 'center',
};
const GitPage = () => {
  //const [isModalOpen, setIsModalOpen] = useState(false);
  const codeChangesDispatch = useCodeChangesDispatchContext();
  const { originalDiff, updatedDiff } = useCodeChangesContext();
  const commitModalDispatch = useCommitModalDispatchContext();

  useEffect(() => {
    codeChangesDispatch(createDiff());
  }, []);

  return (
    <Stack
      direction="row"
      flexGrow={1}
      height="100%"
      {...(originalDiff ? {} : stackPropsIfNoChanges)}
    >
      <CommitModal />
      {originalDiff ? (
        <>
          <Stack direction="column">
            <Stack direction="row">
              <Button
                startIcon={<SendIcon />}
                color="success"
                onClick={() => {
                  //setIsModalOpen(true);
                  commitModalDispatch(open());
                }}
              >
                Commit
              </Button>
              <Button
                startIcon={<ReplayIcon />}
                color="error"
                onClick={() => codeChangesDispatch(rollback(updatedDiff))}
              >
                Rollback
              </Button>
            </Stack>
            <GitChangesFileTree />
          </Stack>
          <DiffEditor
            language="yml"
            original={originalDiff?.values}
            modified={updatedDiff?.values}
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

export default () => (
  <CommitModalProvider>
    <GitPage />
  </CommitModalProvider>
);
