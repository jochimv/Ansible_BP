import { Box, Button, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { getHostDetails } from '@frontend/utils';
import Editor from '@monaco-editor/react';
import { useState } from 'react';
import { stringify } from 'yaml';
import { Breadcrumbs } from '@mui/material';
import Link from 'next/link';
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

/*todo: přepsat strukturu hostDetails pro Toggle button group, čili aby na tom člo zavolat map, něco jako {inventoryType, groupName, vars: [{type: "common", values: {...}}, {type: "group", values: {...}}]}*/
const HostDetailsPage = ({ host, project, hostDetails }: HostPageProps) => {
  const [inventoryHostDetails, setInventoryHostDetails] = useState(hostDetails[0]);
  const [variablesToShow, setVariablesToShow] = useState(inventoryHostDetails.variables[0]);
  const [isEditMode, setIsEditMode] = useState(false);
  const variablesPath = variablesToShow?.path;
  const isEditorReadOnly = variablesToShow?.type === 'applied';
  console.log(variablesToShow?.type, isEditorReadOnly);

  return (
    <>
      <Stack direction="row" sx={{ height: '100%' }}>
        <Box>
          <Breadcrumbs>
            <Link href="/">{project}</Link>
            <Typography>{host}</Typography>
          </Breadcrumbs>
          <Typography>Found in inventories</Typography>
          <ToggleButtonGroup
            orientation="horizontal"
            value={inventoryHostDetails}
            exclusive
            onChange={(_event, newHostDetails) => {
              console.log(newHostDetails);
              if (newHostDetails !== null) {
                setVariablesToShow(newHostDetails.variables[0]);
                setInventoryHostDetails(newHostDetails);
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
          {variablesPath && (
            <>
              <Typography>Variables</Typography>
              <ToggleButtonGroup
                orientation="horizontal"
                value={variablesToShow}
                exclusive
                onChange={(_event, newCurrentHostVariables) => {
                  if (newCurrentHostVariables !== null) {
                    setVariablesToShow(newCurrentHostVariables);
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
          <Button onClick={() => setIsEditMode(!isEditMode)}>{`${
            isEditMode ? 'Read' : 'Edit'
          } mode`}</Button>
        </Box>
        {variablesPath ? (
          <Stack direction="column" flexGrow={1}>
            <div>{variablesPath}</div>
            <Editor
              options={{ readOnly: isEditorReadOnly || !isEditMode }}
              defaultLanguage="yaml"
              value={stringify(variablesToShow.values)}
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
