import { createContext, useContext } from 'react';
import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { getHostDetails } from '@frontend/utils';
import Editor from '@monaco-editor/react';
import { useState } from 'react';
import { stringify } from 'yaml';
import { Breadcrumbs } from '@mui/material';
import Link from 'next/link';
import { useEditModeContext } from '@frontend/pages/context';
interface HostPageProps {
  host: string;
  project: string;
  hostDetails: hostDetails[];
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

const HostDetailsPage = ({ host, project, hostDetails }: HostPageProps) => {
  const [inventoryHostDetails, setInventoryHostDetails] = useState(hostDetails[0]);
  const [selectedVariables, setSelectedVariables] = useState(inventoryHostDetails.variables[0]);
  const isEditMode = useEditModeContext();
  const selectedVariablesPathInProject = selectedVariables?.pathInProject;
  const selectedVariablesAreAppliedVariables = selectedVariables?.type === 'applied';

  return (
    <>
      <Stack direction="row" sx={{ height: '100%' }}>
        <Box>
          <Breadcrumbs>
            <Link href="/" color="inherit">
              {project}
            </Link>
            <Typography>{host}</Typography>
          </Breadcrumbs>
          <Typography sx={{ fontWeight: 'bold' }}>Group name</Typography>
          <Typography>{inventoryHostDetails.groupName}</Typography>
          <Typography sx={{ fontWeight: 'bold' }}>Variables</Typography>
          <Box>
            <Typography>Inventory</Typography>
            <ToggleButtonGroup
              orientation="horizontal"
              value={inventoryHostDetails}
              exclusive
              onChange={(_event, newHostDetails) => {
                if (newHostDetails !== null) {
                  const type = selectedVariables.type;
                  const newVariables = getVariablesByType(newHostDetails, type);
                  setInventoryHostDetails(newHostDetails);
                  setSelectedVariables(newVariables || newHostDetails.variables[0]);
                }
              }}
            >
              {hostDetails.map((hostDetail) => {
                const inventoryType = hostDetail.inventoryType;
                return (
                  <ToggleButton key={inventoryType} value={hostDetail} size="small">
                    {inventoryType}
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
          </Box>
          <Box>
            {selectedVariablesPathInProject && (
              <>
                <Typography>Variables</Typography>
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
                  {inventoryHostDetails.variables.map((variable) => {
                    const type = variable.type;
                    return (
                      <ToggleButton size="small" key={type} value={variable}>
                        {type}
                      </ToggleButton>
                    );
                  })}
                </ToggleButtonGroup>
              </>
            )}
          </Box>
        </Box>
        {Object.keys(selectedVariables.values).length > 0 ? (
          <Stack direction="column" flexGrow={1}>
            <div>{selectedVariablesPathInProject}</div>
            <Editor
              options={{ readOnly: selectedVariablesAreAppliedVariables || !isEditMode }}
              defaultLanguage="yaml"
              value={stringify(selectedVariables.values)}
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
  const { host, project } = context.query;
  const hostDetails = getHostDetails(project, host);
  return { props: { host, project, hostDetails } };
}
