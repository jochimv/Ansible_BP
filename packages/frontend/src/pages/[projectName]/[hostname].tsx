import { useQuery } from 'react-query';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  Alert,
  Box,
  Snackbar,
  Stack,
  styled,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import Editor from '@monaco-editor/react';
import { Breadcrumbs } from '@mui/material';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/codeChanges/CodeChangesContext';
import {
  initializeEditor,
  showHostDetails,
  showVariables,
  updateVariables,
} from '@frontend/codeChanges/codeChangesReducer';
import HostNotFound from '@frontend/components/pages/HostNotFound';
import ProjectNotFound from '@frontend/components/pages/ProjectNotFound';
import LoadingPage from '@frontend/components/pages/Loading';
import { HostDetails } from '@frontend/utils/types';
import { BE_IP_ADDRESS } from '@frontend/utils/constants';

const fetchHostDetails = async (projectName: string, hostname: string | string[]) =>
  await axios.get(`http://${BE_IP_ADDRESS}:4000/${projectName}/${hostname}`);

const getVariablesByType = (obj: any, type: string) => {
  const variablesArray = obj.variables;
  for (let i = 0; i < variablesArray.length; i++) {
    if (variablesArray[i].type === type) {
      return variablesArray[i];
    }
  }
  return null;
};

const renderBreadcrumbs = (path: string) => {
  const segments = path.split('\\');

  return (
    <Breadcrumbs aria-label="breadcrumb">
      {segments.map((segment: string, index: number) => (
        <Typography key={index}>{segment}</Typography>
      ))}
    </Breadcrumbs>
  );
};

const formatErrorMessage = (message: string): JSX.Element => {
  const lines = message.split('\n');
  return (
    <div>
      {lines.map((line: string, index: number) => (
        <div key={index}>{line || '\u00A0'}</div>
      ))}
    </div>
  );
};

const Heading = styled(Typography)({
  fontWeight: 'bold',
  paddingBottom: '4px',
});

const HeadingNoSpacing = styled(Typography)({
  fontWeight: 'bold',
});

const HostDetailsPage = () => {
  const router = useRouter();
  const { projectName, hostname } = router.query;
  const dispatch = useCodeChangesDispatchContext();
  const {
    isInEditMode,
    selectedHostDetails,
    selectedVariables,
    selectedHostDetailsByInventoryType,
  } = useCodeChangesContext();

  const {
    isLoading: hostDataLoading,
    isSuccess,
    data,
  } = useQuery(
    ['hostDetails', { projectName, hostname }],
    () => {
      if (typeof projectName === 'string' && typeof hostname === 'string') {
        return fetchHostDetails(projectName, hostname);
      }
    },
    {
      enabled: !!projectName && !!hostname,
      onSuccess: (data) => {
        if (data?.data) {
          const { hostDetailsByInventoryType, projectExists, hostExists } = data.data;
          if (projectExists && hostExists) {
            dispatch(
              initializeEditor({
                hostDetailsByInventoryType,
                projectName,
                hostname,
              }),
            );
          }
        }
      },
    },
  );

  if (hostDataLoading || !projectName || !hostname || !isSuccess) {
    return <LoadingPage />;
  }

  const { projectExists, hostExists } = data?.data || {};

  if (!projectExists) {
    return <ProjectNotFound />;
  } else if (!hostExists) {
    return <HostNotFound />;
  }

  const handleEditorChange = (newEditorValue: string | undefined) => {
    dispatch(updateVariables({ newEditorValue, projectName, hostname }));
  };

  return (
    <Stack direction="row" sx={{ height: '100%' }}>
      <Stack spacing={3}>
        <Box>
          <HeadingNoSpacing>Project name</HeadingNoSpacing>
          <Typography>{projectName}</Typography>
        </Box>
        <Box>
          <HeadingNoSpacing>Group name</HeadingNoSpacing>
          <Typography>{selectedHostDetails?.groupName}</Typography>
        </Box>
        <Box>
          <HeadingNoSpacing>Host name</HeadingNoSpacing>
          <Typography>{hostname}</Typography>
        </Box>
        <Box>
          <Heading>Inventories</Heading>
          <ToggleButtonGroup
            orientation="horizontal"
            exclusive
            onChange={(_event, newSelectedHostDetails) => {
              if (newSelectedHostDetails !== null) {
                const type = selectedVariables.type;
                const newVariables = getVariablesByType(newSelectedHostDetails, type);
                dispatch(showHostDetails(newSelectedHostDetails));
                dispatch(showVariables(newVariables || newSelectedHostDetails.variables[0]));
              }
            }}
          >
            {selectedHostDetailsByInventoryType?.map((hostDetail: HostDetails) => {
              const inventoryType = hostDetail.inventoryType;
              return (
                <ToggleButton
                  disabled={hostDetail.inventoryType === selectedHostDetails?.inventoryType}
                  key={inventoryType}
                  value={hostDetail}
                  size="small"
                >
                  {inventoryType}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Box>
        <Box>
          <Heading>Variables</Heading>
          <ToggleButtonGroup
            orientation="horizontal"
            exclusive
            onChange={(_event, newCurrentHostVariables) => {
              if (newCurrentHostVariables !== null) {
                dispatch(showVariables(newCurrentHostVariables));
              }
            }}
          >
            {selectedHostDetails?.variables.map((variableObj) => {
              const variablesType = variableObj.type;
              return (
                <ToggleButton
                  disabled={variableObj.pathInProject === selectedVariables.pathInProject}
                  size="small"
                  key={variablesType}
                  value={variableObj}
                >
                  {variablesType}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Box>
      </Stack>
      {selectedVariables?.values !== undefined ? (
        <Stack direction="column" flexGrow={1} spacing={2}>
          <Box ml={4}>
            {selectedVariables?.type === 'applied'
              ? selectedVariables?.pathInProject
              : renderBreadcrumbs(selectedVariables?.pathInProject)}
          </Box>
          <Editor
            options={{ readOnly: selectedVariables?.type === 'applied' || !isInEditMode }}
            language="yaml"
            value={selectedVariables.values}
            onChange={handleEditorChange}
            // avoid multi-model editor, it as it causes bugs: when you delete one of the variables completely and applied variables are not updated, and also shows outdated selectedVariables when switching between different hosts
            // Taktéž se při multi-model editoru applied variables nezobrazí správně po změně jiných variables
            //path={selectedVariables?.pathInProject}
          />
        </Stack>
      ) : (
        <Typography>No variables found</Typography>
      )}
      {selectedVariables?.type === 'applied' && (
        <Snackbar open>
          <Alert severity="info">Read only</Alert>
        </Snackbar>
      )}
      {selectedVariables?.error && (
        <Snackbar open>
          <Alert severity="error">{formatErrorMessage(selectedVariables.error)}</Alert>
        </Snackbar>
      )}
    </Stack>
  );
};

export default HostDetailsPage;
