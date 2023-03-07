import { useEffect } from 'react';
import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { getHostDetails } from '@frontend/utils';
import Editor from '@monaco-editor/react';
import { useState } from 'react';
import { Breadcrumbs } from '@mui/material';
import Link from 'next/link';
import { useEditModeContext } from '@frontend/pages/context';
import { stringify } from 'yaml';
import { parse } from 'yaml';
interface HostPageProps {
  hostname: string;
  projectName: string;
  hostDetailsByInventoryType: hostDetails[];
}

interface hostDetails {
  inventoryType: string;
  groupName: string;
  commonVars?: any;
  groupVars?: any;
  hostVars?: any;
}

const getVariablesByType = (obj, type: string) => {
  const variablesArray = obj.variables;
  for (let i = 0; i < variablesArray.length; i++) {
    if (variablesArray[i].type === type) {
      return variablesArray[i];
    }
  }
  return null;
};

function removeFromChangedVariables(variable: string): void {
  const changedVariables = JSON.parse(localStorage.getItem('changed-variables') || '[]');
  const filteredVariables = changedVariables.filter((v: string) => v !== variable);
  localStorage.setItem('changed-variables', JSON.stringify(filteredVariables));
}
function addToChangedVariables(variable: string): void {
  const changedVariables: string[] = JSON.parse(localStorage.getItem('changed-variables') || '[]');
  changedVariables.push(variable);

  localStorage.setItem('changed-variables', JSON.stringify(changedVariables));
}
const HostDetailsPage = ({ hostname, projectName, hostDetailsByInventoryType }: HostPageProps) => {
  const [hostDetails, setHostDetails] = useState(hostDetailsByInventoryType[0]);
  const [selectedVariables, setSelectedVariables] = useState(hostDetails.variables[0]);
  const selectedVariablesPathInProject = selectedVariables?.pathInProject;
  const selectedVariablesAreAppliedVariables = selectedVariables?.type === 'applied';

  const isInEditMode = useEditModeContext();

  const handleEditorChange = (newEditorValue) => {
    const localStorageChangedVariablesKey = selectedVariables.pathInProject;
    const localStorageNewVariablesKey = `${localStorageChangedVariablesKey}-new`;
    const localStorageOldVariablesKey = `${localStorageChangedVariablesKey}-old`;
    const oldVariables = localStorage.getItem(localStorageOldVariablesKey);
    const newVariables = JSON.stringify(parse(newEditorValue));
    if (oldVariables === newVariables) {
      localStorage.removeItem(localStorageNewVariablesKey);
      removeFromChangedVariables(localStorageChangedVariablesKey);
    } else {
      localStorage.setItem(localStorageNewVariablesKey, newVariables);
      addToChangedVariables(localStorageChangedVariablesKey);
    }
  };
  useEffect(() => {
    hostDetailsByInventoryType.forEach((detail) => {
      detail.variables
        .filter((variable) => variable.type !== 'applied')
        .forEach((variable) => {
          const localStorageVariablesPath = `${variable.pathInProject}-old`;
          if (!localStorage.getItem(localStorageVariablesPath)) {
            localStorage.setItem(localStorageVariablesPath, JSON.stringify(variable.values));
          }
        });
    });
  }, []);

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
            <Typography>{hostDetails.groupName}</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 'bold' }}>Inventory</Typography>
            <ToggleButtonGroup
              orientation="horizontal"
              value={hostDetails}
              exclusive
              onChange={(_event, newHostDetails) => {
                if (newHostDetails !== null) {
                  const type = selectedVariables.type;
                  const newVariables = getVariablesByType(newHostDetails, type);
                  setHostDetails(newHostDetails);
                  setSelectedVariables(newVariables || newHostDetails.variables[0]);
                }
              }}
            >
              {hostDetailsByInventoryType.map((hostDetail) => {
                const inventoryType = hostDetail.inventoryType;
                return (
                  <ToggleButton key={inventoryType} value={hostDetail} size="small">
                    {inventoryType}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </Box>
          {selectedVariablesPathInProject && (
            <Box>
              <Typography sx={{ fontWeight: 'bold' }}>Variables</Typography>
              <ToggleButtonGroup
                orientation="horizontal"
                value={selectedVariables}
                exclusive
                onChange={(_event, newCurrentHostVariables) => {
                  if (newCurrentHostVariables !== null) {
                    setSelectedVariables(newCurrentHostVariables);
                  }
                }}
              >
                {hostDetails.variables.map((variableObj) => {
                  const variablesType = variableObj.type;
                  return (
                    <ToggleButton size="small" key={variablesType} value={variableObj}>
                      {variablesType}
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
            </Box>
          )}
        </Stack>
        {Object.keys(selectedVariables.values).length > 0 ? (
          <Stack direction="column" flexGrow={1}>
            <div>{selectedVariablesPathInProject}</div>
            <Editor
              options={{ readOnly: selectedVariablesAreAppliedVariables || !isInEditMode }}
              defaultLanguage="yaml"
              value={stringify(selectedVariables.values)}
              onChange={handleEditorChange}
            />
          </Stack>
        ) : (
          <Typography>No variables found</Typography>
        )}
      </Stack>
    </>
  );
};

export default HostDetailsPage;

export async function getServerSideProps(context: any) {
  const { hostname, projectName } = context.query;
  const hostDetailsByInventoryType = getHostDetails(projectName, hostname);
  return { props: { hostname, projectName, hostDetailsByInventoryType } };
}
