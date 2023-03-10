import { useEffect, useState } from 'react';
import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { getHostDetails } from '@frontend/utils';
import Editor from '@monaco-editor/react';
import { Breadcrumbs } from '@mui/material';
import Link from 'next/link';
import { parse, stringify } from 'yaml';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/pages/providers/context';
import {
  addHostDetailsByInventory,
  HostDetails,
  showHostDetails,
  showVariables,
  updateHostDetailsByInventoryType,
} from '@frontend/pages/providers/reducer';

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

const HostDetailsPage = ({ hostname, projectName, hostDetailsByInventoryType }: HostPageProps) => {
  const {
    isInEditMode,
    hostDetails,
    selectedVariables,
    hostDetailsByInventoryType: contextHostDetailsByInventoryType,
  } = useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();

  const selectedVariablesPathInProject = selectedVariables?.pathInProject;
  const selectedVariablesAreAppliedVariables = selectedVariables?.type === 'applied';

  useEffect(() => {
    dispatch(addHostDetailsByInventory(hostDetailsByInventoryType));
    dispatch(showHostDetails(hostDetailsByInventoryType[0]));
    dispatch(showVariables(hostDetailsByInventoryType[0].variables[0]));
  }, []);

  const handleEditorChange = (newEditorValue: string) => {
    const updatedContextHostDetails = contextHostDetailsByInventoryType.map((hostDetail) => {
      if (hostDetail.inventoryType === hostDetails?.inventoryType) {
        return {
          ...hostDetail,
          variables: hostDetail.variables.map((variable) => {
            if (variable.pathInProject === selectedVariables.pathInProject) {
              return { ...variable, values: parse(newEditorValue) };
            } else {
              return variable;
            }
          }),
        };
      } else {
        return hostDetail;
      }
    });
    const updatedHostDetails = {
      ...hostDetails,
      variables: hostDetails?.variables.map((variable) => {
        if (variable.pathInProject === selectedVariables.pathInProject) {
          return { ...variable, values: parse(newEditorValue) };
        } else {
          return variable;
        }
      }),
    };

    const updatedSelectedVariables = { ...selectedVariables, values: parse(newEditorValue) };
    dispatch(showHostDetails(updatedHostDetails));
    dispatch(showVariables(updatedSelectedVariables));
    dispatch(addHostDetailsByInventory(updatedContextHostDetails));
  };

  console.log('ContextHostDetailsByInventoryType', contextHostDetailsByInventoryType);
  console.log('hostDetails', hostDetails);
  console.log('selectedVariables', selectedVariables);

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
            <Typography>{hostDetails?.groupName}</Typography>
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
                  dispatch(showHostDetails(newHostDetails));
                  dispatch(showVariables(newVariables || newHostDetails.variables[0]));
                }
              }}
            >
              {contextHostDetailsByInventoryType.map((hostDetail) => {
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
                    dispatch(showVariables(newCurrentHostVariables));
                  }
                }}
              >
                {hostDetails?.variables.map((variableObj) => {
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
        {Object.keys(selectedVariables?.values || []).length > 0 ? (
          <Stack direction="column" flexGrow={1}>
            <div>{selectedVariablesPathInProject}</div>
            <Editor
              options={{ readOnly: selectedVariablesAreAppliedVariables || !isInEditMode }}
              defaultLanguage="yaml"
              value={stringify(selectedVariables.values)}
              onChange={handleEditorChange}
              path={selectedVariablesPathInProject}
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
