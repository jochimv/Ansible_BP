import { useEffect } from 'react';
import {
  Alert,
  Box,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { getHostDetails } from '@frontend/utils';
import Editor from '@monaco-editor/react';
import { Breadcrumbs } from '@mui/material';
import Link from 'next/link';
import { useCodeChangesContext, useCodeChangesDispatchContext } from '@frontend/context/context';
import {
  HostDetails,
  initializeEditor,
  showHostDetails,
  showVariables,
  updateVariables,
} from '@frontend/context/reducer';

interface HostPageProps {
  hostDetailsByInventoryType: HostDetails[];
  hostname: string;
  projectName: string;
}

const getVariablesByType = (obj: any, type: string) => {
  const variablesArray = obj.variables;
  for (let i = 0; i < variablesArray.length; i++) {
    if (variablesArray[i].type === type) {
      return variablesArray[i];
    }
  }
  return null;
};

const formatErrorMessage = (message: string): JSX.Element => {
  const lines = message.split('\n');
  return (
    <div>
      {lines.map((line, index) => (
        <div key={index}>{line || '\u00A0'}</div>
      ))}
    </div>
  );
};

const HostDetailsPage = ({ hostname, projectName, hostDetailsByInventoryType }: HostPageProps) => {
  const {
    isInEditMode,
    selectedHostDetails,
    selectedVariables,
    selectedHostDetailsByInventoryType: contextHostDetailsByInventoryType,
  } = useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();
  const selectedVariablesPathInProject = selectedVariables?.pathInProject;
  const selectedVariablesAreAppliedVariables = selectedVariables?.type === 'applied';

  useEffect(() => {
    dispatch(initializeEditor({ hostDetailsByInventoryType, projectName }));
  }, []);

  const handleEditorChange = (newEditorValue: string | null) => {
    dispatch(updateVariables({ newEditorValue, projectName }));
  };

  return (
    <>
      <Stack direction="row" sx={{ height: '100%' }}>
        <Stack spacing={3}>
          <Breadcrumbs>
            <Link href={`/${projectName}`} color="inherit">
              {projectName}
            </Link>
            <Typography>{hostname}</Typography>
          </Breadcrumbs>
          <Box>
            <Typography sx={{ fontWeight: 'bold' }}>Server group</Typography>
            <Typography>{selectedHostDetails?.groupName}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 'bold' }}>Inventory</Typography>
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
              {contextHostDetailsByInventoryType.map((hostDetail) => {
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
            <Typography sx={{ fontWeight: 'bold' }}>Variables</Typography>
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
          <Stack direction="column" flexGrow={1}>
            <div>{selectedVariablesPathInProject}</div>
            <Editor
              options={{ readOnly: selectedVariablesAreAppliedVariables || !isInEditMode }}
              defaultLanguage="yaml"
              value={selectedVariables.values}
              onChange={handleEditorChange}
              // avoid multi-model editor, it as it causes bugs: when you delete one of the variables completely and applied variables are not updated, and also shows outdated selectedVariables when switching between different hosts
            />
          </Stack>
        ) : (
          <Typography>No variables found</Typography>
        )}
        {selectedVariables?.error && (
          <Snackbar open>
            <Alert severity="error">{formatErrorMessage(selectedVariables.error)}</Alert>
          </Snackbar>
        )}
      </Stack>
    </>
  );
};

export default HostDetailsPage;

export async function getServerSideProps(context: any) {
  const { hostname, projectName } = context.query;
  const hostDetailsByInventoryType = getHostDetails(projectName, hostname);
  return {
    props: {
      hostname,
      projectName,
      hostDetailsByInventoryType,
    },
  };
}
