import React, { useState } from 'react';
import { Box, Stack, TextField, Typography } from '@mui/material';
import { TreeView } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TreeViewInventoryItem } from '@frontend/types';
import { countServers, filterTreeItems, findNode, renderTree } from '@frontend/utils';
import { useRouter } from 'next/router';

interface ProjectDetailsTreeProps {
  data: TreeViewInventoryItem[];
  onNodeSelected: React.Dispatch<React.SetStateAction<any>>;
}

const ProjectDetailsTree = ({ data, onNodeSelected }: ProjectDetailsTreeProps) => {
  const [expanded, setExpanded] = useState<string[]>(['inventory-0', 'group-0-0']);
  const [selected, setSelected] = useState<string>('host-0-0-0');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { projectName } = useRouter().query;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredData = filterTreeItems(data, searchTerm);
  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event: React.SyntheticEvent, nodeId: string) => {
    if (nodeId.startsWith('host-')) {
      setSelected(nodeId);

      const selectedNode = findNode(data, nodeId);

      if (selectedNode && onNodeSelected) {
        onNodeSelected(selectedNode);
      }
    }
  };

  const serverCount = countServers(filteredData);

  return (
    <>
      <Stack direction="row" alignItems="center">
        <Typography variant="h4">{projectName}</Typography>
        {searchTerm && (
          <Typography variant="subtitle2" sx={{ ml: 2 }}>
            {`${serverCount} server${serverCount !== 1 ? 's' : ''} found`}
          </Typography>
        )}
      </Stack>
      <TextField
        label="Search"
        value={searchTerm}
        onChange={handleSearchChange}
        variant="outlined"
        fullWidth
        size="small"
        sx={{ my: 2 }}
      />
      <Box sx={{ height: '82%', width: '100%', overflowY: 'auto' }}>
        <TreeView
          expanded={expanded}
          selected={selected}
          onNodeToggle={handleToggle}
          onNodeSelect={handleSelect}
          sx={{ width: 250 }}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
        >
          {filteredData.map(renderTree)}
        </TreeView>
      </Box>
    </>
  );
};

export default ProjectDetailsTree;
