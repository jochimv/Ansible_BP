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
import { useCommitModalDispatchContext } from '@frontend/components/CommitModal/state/CommitModalContext';
import CommitModalProvider from '@frontend/components/CommitModal/state/CommitModalProvider';
import { useRouter } from 'next/router';
import { simpleGit } from 'simple-git';
import { join } from 'path';
import { ansibleReposPath, getMainBranchName } from '@frontend/utils';

const stackPropsIfNoChanges = {
  alignItems: 'center',
  justifyContent: 'center',
};
const GitPage = ({ mainBranchName }) => {
  const codeChangesDispatch = useCodeChangesDispatchContext();
  const { originalDiff, updatedDiff } = useCodeChangesContext();
  const commitModalDispatch = useCommitModalDispatchContext();
  const router = useRouter();
  const { projectName } = router.query;

  useEffect(() => {
    codeChangesDispatch(createDiff(projectName));
  }, []);

  return (
    <Stack
      direction="row"
      flexGrow={1}
      height="100%"
      {...(originalDiff ? {} : stackPropsIfNoChanges)}
    >
      <CommitModal mainBranchName={mainBranchName} />
      {originalDiff ? (
        <>
          <Stack direction="column">
            <Stack direction="row">
              <Button
                startIcon={<SendIcon />}
                color="success"
                onClick={() => {
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

export default ({ mainBranchName }) => (
  <CommitModalProvider>
    <GitPage mainBranchName={mainBranchName} />
  </CommitModalProvider>
);

export async function getServerSideProps(context: any) {
  const { projectName } = context.query;
  const projectPath = join(ansibleReposPath, projectName);
  const git = await simpleGit(projectPath);
  const mainBranchName = await getMainBranchName(git);
  return {
    props: { mainBranchName },
  };
}
