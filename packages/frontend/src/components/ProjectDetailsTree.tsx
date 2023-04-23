import React, { useState } from 'react';
import { TextField, Box } from '@mui/material';
import { TreeView, TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { faServer } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TreeViewInventoryItem } from '@frontend/types';
interface ProjectDetailsTreeProps {
  data: TreeViewInventoryItem[];
  onNodeSelected: React.Dispatch<React.SetStateAction<any>>;
}

const filterTreeItems = (
  nodes: TreeViewInventoryItem[],
  searchTerm: string,
): TreeViewInventoryItem[] => {
  return nodes
    .map((node: TreeViewInventoryItem) => {
      if (node.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return node;
      }
      if (Array.isArray(node.children)) {
        const filteredChildren = filterTreeItems(node.children, searchTerm);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }
      return null;
    })
    .filter((node) => node !== null) as TreeViewInventoryItem[];
};

const renderTree = (nodes: TreeViewInventoryItem) => {
  return (
    <TreeItem
      icon={
        Array.isArray(nodes.children) ? undefined : (
          <FontAwesomeIcon icon={faServer} style={{ color: 'gray' }} />
        )
      }
      key={nodes.id}
      nodeId={nodes.id}
      label={nodes.name}
    >
      {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
    </TreeItem>
  );
};

const ProjectDetailsTree = ({ data, onNodeSelected }: ProjectDetailsTreeProps) => {
  const [expanded, setExpanded] = useState<string[]>(['inventory-0', 'group-0-0']);
  const [selected, setSelected] = useState<string>('host-0-0-0');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredData = filterTreeItems(data, searchTerm);
  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const findNode = (
    data: TreeViewInventoryItem[],
    nodeId: string,
  ): TreeViewInventoryItem | undefined => {
    for (const inventory of data) {
      for (const group of inventory?.children || []) {
        for (const host of group?.children || []) {
          if (host.id === nodeId) {
            return host;
          }
        }
      }
    }
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

  return (
    <>
      <TextField
        label="Search"
        value={searchTerm}
        onChange={handleSearchChange}
        variant="outlined"
        fullWidth
        size="small"
        sx={{ my: 2 }}
      />
      <Box sx={{ height: '87%', width: '100%', overflowY: 'auto' }}>
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
