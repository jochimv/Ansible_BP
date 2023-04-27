import { DiffEditor } from '@monaco-editor/react';
import { Stack, Typography, Button, Box } from '@mui/material';
import {
  Replay as ReplayIcon,
  CodeOff as CodeOffIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import { createDiff, rollback } from '@frontend/reducers/codeChangesReducer';
import GitChangesFileTree from '@frontend/components/GitChangesFileTree';
import CommitModal from '@frontend/components/CommitModal';
import { open } from '@frontend/reducers/commitModalReducer';
import CommitModalProvider, {
  useCommitModalDispatchContext,
} from '@frontend/context/CommitModalContext';
import { useRouter } from 'next/router';
import ProjectNotFound from '@frontend/components/ProjectNotFound';
import axios, { AxiosResponse } from 'axios';
import { useQuery } from 'react-query';
import LoadingPage from '@frontend/components/Loading';
import { notFoundIconSx } from '@frontend/constants';
const stackPropsIfNoChanges = {
  alignItems: 'center',
  justifyContent: 'center',
};
import { ProjectMainBranch } from '@frontend/types';
import { BE_IP_ADDRESS } from '@frontend/constants';

const fetchMainBranchName = async (projectName: string): Promise<ProjectMainBranch> => {
  const response: AxiosResponse<any> = await axios.get(
    `http://${BE_IP_ADDRESS}:4000/${projectName}/main-branch-name`,
  );
  return response.data;
};

const GitPage = () => {
  const codeChangesDispatch = useCodeChangesDispatchContext();
  const { projectName } = useRouter().query;
  const { originalDiff, updatedDiff } = useCodeChangesContext();
  const commitModalDispatch = useCommitModalDispatchContext();
  const { data, isLoading, isSuccess } = useQuery(
    ['mainBranchName', projectName],
    () => {
      if (typeof projectName === 'string') {
        return fetchMainBranchName(projectName);
      }
    },
    {
      enabled: !!projectName,
      onSuccess: (data: ProjectMainBranch) => {
        if (data?.projectExists) {
          codeChangesDispatch(createDiff(projectName));
        }
      },
    },
  );

  if (isLoading || !projectName || !isSuccess) {
    return <LoadingPage />;
  }

  const { mainBranchName, projectExists } = data;

  if (!projectExists) {
    return <ProjectNotFound />;
  }

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
          <Stack direction="column" sx={{ width: '20%' }}>
            <Stack direction="row" mb={1} columnGap={1}>
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
          <Box sx={{ width: '80%' }}>
            <DiffEditor
              language="yml"
              original={originalDiff?.values}
              modified={updatedDiff?.values}
              height="100%"
              options={{ readOnly: true }}
            />
          </Box>
        </>
      ) : (
        <Stack direction="column" alignItems="center">
          <CodeOffIcon sx={notFoundIconSx} />
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
