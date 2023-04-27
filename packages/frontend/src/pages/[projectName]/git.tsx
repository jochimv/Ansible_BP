import { DiffEditor } from '@monaco-editor/react';
import { Stack, Typography, Button, Box, IconButton } from '@mui/material';
import {
  Replay as ReplayIcon,
  CodeOff as CodeOffIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import { createDiff, edit, rollback } from '@frontend/reducers/codeChangesReducer';
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
import { HostVariable, ProjectMainBranch } from '@frontend/types';
import { BE_IP_ADDRESS } from '@frontend/constants';
import EditIcon from '@mui/icons-material/Edit';
import React from 'react';

const fetchMainBranchName = async (projectName: string): Promise<ProjectMainBranch> => {
  const response: AxiosResponse<any> = await axios.get(
    `http://${BE_IP_ADDRESS}:4000/${projectName}/main-branch-name`,
  );
  return response.data;
};

const GitPage = () => {
  const { originalVars, selectedProjectName, originalDiff, updatedDiff } = useCodeChangesContext();
  const router = useRouter();

  const navigate = (path: string) => router.push(path);

  const paths =
    originalVars
      ?.map((originalVar: HostVariable) => originalVar.pathInProject)
      // only show diff for the current project
      .filter((path: string) => path.split('\\')[0] === selectedProjectName) || [];

  const selectedNodeId = originalDiff?.pathInProject || paths[0];

  const codeChangesDispatch = useCodeChangesDispatchContext();
  const { projectName } = useRouter().query;
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
                size="small"
              >
                Commit
              </Button>
              <Button
                size="small"
                color="info"
                onClick={() => {
                  codeChangesDispatch(edit({ path: selectedNodeId, navigate }));
                }}
                startIcon={<EditIcon />}
              >
                Edit
              </Button>
              <Button
                size="small"
                startIcon={<ReplayIcon />}
                color="error"
                onClick={() => codeChangesDispatch(rollback(updatedDiff))}
              >
                Rollback
              </Button>
            </Stack>
            <Box sx={{ overflow: 'auto', height: '100%' }}>
              <GitChangesFileTree selectedNodeId={selectedNodeId} paths={paths} />
            </Box>
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
