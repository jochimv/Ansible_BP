import { useRouter } from 'next/router';
import { Box, Stack, Typography } from '@mui/material';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '@frontend/context/CodeChangesContext';
import { showHostDetails, showVariables } from '@frontend/reducers/codeChangesReducer';
import ToggleButtonGroupWrapper from '@frontend/components/ToggleButtonGroupWrapper';
import { getVariablesByType } from '@frontend/utils';

const HostInfoBox = () => {
  const router = useRouter();
  const { projectName, hostname } = router.query;
  const { selectedHostDetails, selectedHostDetailsByInventoryType, selectedVariables } =
    useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography fontWeight="bold">Project name</Typography>
        <Typography id="project-name-label">{projectName}</Typography>
      </Box>
      <Box>
        <Typography fontWeight="bold">Group name</Typography>
        <Typography id="group-name-label">{selectedHostDetails?.groupName}</Typography>
      </Box>
      <Box>
        <Typography fontWeight="bold">Host name</Typography>
        <Typography id="hostname-label">{hostname}</Typography>
      </Box>
      <ToggleButtonGroupWrapper
        items={selectedHostDetailsByInventoryType}
        selectedItem={selectedHostDetails}
        comparisonKey="inventoryType"
        onChange={(newSelectedHostDetails) => {
          if (newSelectedHostDetails !== null) {
            const type = selectedVariables.type;
            const newVariables = getVariablesByType(newSelectedHostDetails, type);
            dispatch(showHostDetails(newSelectedHostDetails));
            dispatch(showVariables(newVariables || newSelectedHostDetails.variables[0]));
          }
        }}
        label="Inventories"
        buttonIdPrefix="inventory-button"
      />
      <ToggleButtonGroupWrapper
        items={selectedHostDetails?.variables}
        selectedItem={selectedVariables}
        comparisonKey="pathInProject"
        onChange={(newCurrentHostVariables) => {
          if (newCurrentHostVariables !== null) {
            dispatch(showVariables(newCurrentHostVariables));
          }
        }}
        label="Variables"
        buttonIdPrefix="variables-button"
      />
    </Stack>
  );
};

export default HostInfoBox;
