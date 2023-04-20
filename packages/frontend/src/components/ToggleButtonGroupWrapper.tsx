import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';

interface ToggleButtonGroupWrapperProps {
  items: any[] | undefined | null;
  selectedItem: any;
  onChange: (newValue: any) => void;
  label: string;
  buttonIdPrefix: string;
  comparisonKey: string;
}

const ToggleButtonGroupWrapper: React.FC<ToggleButtonGroupWrapperProps> = ({
  items,
  selectedItem,
  onChange,
  label,
  buttonIdPrefix,
  comparisonKey,
}) => {
  return (
    <Box>
      <Typography fontWeight="bold" paddingBottom="4px">
        {label}
      </Typography>
      <ToggleButtonGroup
        orientation="horizontal"
        exclusive
        onChange={(_event, newSelectedItem) => {
          if (newSelectedItem !== null) {
            onChange(newSelectedItem);
          }
        }}
      >
        {items?.map((item, index: number) => {
          const identifier = item.type || item.inventoryType;
          return (
            <ToggleButton
              id={`${buttonIdPrefix}-${identifier}`}
              disabled={item[comparisonKey] === selectedItem[comparisonKey]}
              key={index}
              value={item}
              size="small"
            >
              {identifier}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>
    </Box>
  );
};

export default ToggleButtonGroupWrapper;
