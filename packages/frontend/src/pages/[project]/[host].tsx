import { Box, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
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

const EditorWithHeading = ({ heading, ...other }) => (
  <>
    <Typography>{heading}</Typography>
    <Editor {...other} />
  </>
);

/*todo: přepsat strukturu hostDetails pro Toggle button group, čili aby na tom člo zavolat map, něco jako {inventoryType, groupName, vars: [{type: "common", values: {...}}, {type: "group", values: {...}}]}*/
const HostDetailsPage = ({ host, project, hostDetails }: HostPageProps) => {
  const [inventoryHostDetails, setInventoryHostDetails] = useState(hostDetails[0]);
  const [variablesToShow, setVariablesToShow] = useState(inventoryHostDetails.variables[0]);
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
              if (newHostDetails !== null) {
                setInventoryHostDetails(newHostDetails);
              }
            }}
          >
            {hostDetails.map((hostDetail) => {
              const inventoryType = hostDetail.inventoryType;
              return (
                <ToggleButton key={inventoryType} value={hostDetail}>
                  {inventoryType}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>

          <Typography>Variables applied</Typography>
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
                <ToggleButton key={type} value={variable}>
                  {type}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Box>
        <Editor defaultLanguage="yaml" height="unset" value={stringify(variablesToShow.values)} />
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
