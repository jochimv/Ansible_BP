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
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/codeChanges/CodeChangesContext';
import {
  HostDetails,
  initializeEditor,
  showHostDetails,
  showVariables,
  updateVariables,
} from '@frontend/codeChanges/codeChangesReducer';
import HostNotFound from '@frontend/components/notFoundPages/HostNotFound';
import ProjectNotFound from '@frontend/components/notFoundPages/ProjectNotFound';

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

const HostDetailsPage = ({
  hostname,
  projectName,
  hostDetailsByInventoryType,
  projectExists,
  hostExists,
}: HostPageProps) => {
  if (!projectExists) {
    return <ProjectNotFound />;
  } else if (!hostExists) {
    return <HostNotFound />;
  }

  const {
    isInEditMode,
    selectedHostDetails,
    selectedVariables,
    selectedHostDetailsByInventoryType,
  } = useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();

  useEffect(() => {
    // todo - integrace na react query. Problém je v tom, že se bere info ze static props, a tím pádem se soubory z backendu zpracovávají zbytečně když už existují v kontextu.
    dispatch(
      initializeEditor({
        hostDetailsByInventoryType,
        projectName,
        hostname,
      }),
    );
  }, []);

  const handleEditorChange = (newEditorValue: string | undefined) => {
    dispatch(updateVariables({ newEditorValue, projectName, hostname }));
  };

  return (
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
            {selectedHostDetailsByInventoryType?.map((hostDetail) => {
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
          <div>{selectedVariables?.pathInProject}</div>
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

      {selectedVariables?.error && (
        <Snackbar open>
          <Alert severity="error">{formatErrorMessage(selectedVariables.error)}</Alert>
        </Snackbar>
      )}
    </Stack>
  );
};

export default HostDetailsPage;

export async function getServerSideProps(context: any) {
  const { hostname, projectName } = context.query;
  const { hostDetailsByInventoryType, projectExists, hostExists } = await getHostDetails(
    projectName,
    hostname,
  );
  return {
    props: {
      hostname,
      projectName,
      hostDetailsByInventoryType,
      projectExists,
      hostExists,
    },
  };
}
