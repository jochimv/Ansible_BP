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
import { createDiff, rollback } from '../../codeChanges/codeChangesReducer';
import GitChangesFileTree from '../../components/GitChangesFileTree';
import CommitModal from '@frontend/components/CommitModal/CommitModal';
import { open } from '@frontend/components/CommitModal/state/commitModalReducer';
import { useCommitModalDispatchContext } from '@frontend/components/CommitModal/state/CommitModalContext';
import CommitModalProvider from '@frontend/components/CommitModal/state/CommitModalProvider';
import { useRouter } from 'next/router';
import ProjectNotFound from '@frontend/components/pages/ProjectNotFound';
import axios from 'axios';
import {useQuery} from "react-query";
import LoadingPage from "@frontend/components/pages/Loading";
import {BE_IP_ADDRESS} from "@frontend/utils/constants";
const stackPropsIfNoChanges = {
  alignItems: 'center',
  justifyContent: 'center',
};
const fetchMainBranchName = async (projectName : string) => {
  const response = await axios.get(`http://${BE_IP_ADDRESS}:4000/${projectName}/mainBranchName`);
  return response.data;
};

const GitPage = () => {

  const codeChangesDispatch = useCodeChangesDispatchContext();
  const {projectName}= useRouter().query;
  const { originalDiff, updatedDiff } = useCodeChangesContext();
  const commitModalDispatch = useCommitModalDispatchContext();
  const { data, isLoading, isSuccess } = useQuery(
      ['mainBranchName', projectName],
      () => {
        if(typeof projectName === 'string') {
          return fetchMainBranchName(projectName)
        }
      },
      { enabled: !!projectName, onSuccess: (data) => {
        if (data.projectExists){
          codeChangesDispatch(createDiff(projectName));
        }
        }}
  );

  if(isLoading || !projectName || !isSuccess){
    return <LoadingPage/>
  }

  const {mainBranchName, projectExists} = data;

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

export default () => (
  <CommitModalProvider>
    <GitPage />
  </CommitModalProvider>
);
