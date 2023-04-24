import { useQuery } from 'react-query';
import { useRouter } from 'next/router';
import axios, { AxiosResponse } from 'axios';
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
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import {
  initializeEditor,
  showHostDetails,
  showVariables,
  updateVariables,
} from '@frontend/reducers/codeChangesReducer';
import HostNotFound from '@frontend/components/HostNotFound';
import ProjectNotFound from '@frontend/components/ProjectNotFound';
import LoadingPage from '@frontend/components/Loading';
import { HostDetails, HostDetailsResponse, HostVariable } from '@frontend/types';
import { formatErrorMessage, getVariablesByType, renderBreadcrumbs } from '@frontend/utils';
import { BE_IP_ADDRESS } from '@frontend/constants';

const fetchHostDetails = async (
  projectName: string,
  hostname: string | string[],
): Promise<HostDetailsResponse> => {
  const response: AxiosResponse<any> = await axios.get(
    `http://${BE_IP_ADDRESS}:4000/${projectName}/host/${hostname}`,
  );
  return response.data;
};

const HeadingWithBottomPadding = styled(Typography)({
  fontWeight: 'bold',
  paddingBottom: '4px',
});

const Heading = styled(Typography)({
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
      refetchOnWindowFocus: false,
      onSuccess: (response: HostDetailsResponse) => {
        const { hostDetailsByInventoryType, projectExists, hostExists } = response;
        if (projectExists && hostExists) {
          dispatch(
            initializeEditor({
              hostDetailsByInventoryType,
              projectName,
              hostname,
            }),
          );
        }
      },
    },
  );

  if (hostDataLoading || !projectName || !hostname || !isSuccess) {
    return <LoadingPage />;
  }

  const { projectExists, hostExists } = data || {};

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
          <Heading>Project name</Heading>
          <Typography id="project-name-label">{projectName}</Typography>
        </Box>
        <Box>
          <Heading>Group name</Heading>
          <Typography id="group-name-label">{selectedHostDetails?.groupName}</Typography>
        </Box>
        <Box>
          <Heading>Host name</Heading>
          <Typography id="hostname-label">{hostname}</Typography>
        </Box>
        <Box>
          <HeadingWithBottomPadding>Inventories</HeadingWithBottomPadding>
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
                  id={`inventory-button-${inventoryType}`}
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
          <HeadingWithBottomPadding>Variables</HeadingWithBottomPadding>
          <ToggleButtonGroup
            orientation="horizontal"
            exclusive
            onChange={(_event, newCurrentHostVariables) => {
              if (newCurrentHostVariables !== null) {
                dispatch(showVariables(newCurrentHostVariables));
              }
            }}
          >
            {selectedHostDetails?.variables.map((variableObj: HostVariable) => {
              const variablesType = variableObj.type;
              return (
                <ToggleButton
                  id={`variables-button-${variablesType}`}
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
