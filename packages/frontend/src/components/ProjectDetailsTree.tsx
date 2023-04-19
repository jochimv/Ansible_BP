import React, { useState } from 'react';
import { TreeView, TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { faServer } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TreeViewInventoryItem } from '@frontend/utils/types';
import { Box } from '@mui/material';
interface ProjectDetailsTreeProps {
  data: TreeViewInventoryItem[];
  onNodeSelected: React.Dispatch<
    React.SetStateAction<{ id: string; name: string; appliedVariables: string }>
  >;
}

const ProjectDetailsTree = ({ data, onNodeSelected }: ProjectDetailsTreeProps) => {
  const [expanded, setExpanded] = useState<string[]>(['inventory-0', 'group-0-0']);
  const [selected, setSelected] = useState<string>('host-0-0-0');

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event: React.SyntheticEvent, nodeId: string) => {
    if (nodeId.startsWith('host-')) {
      setSelected(nodeId);

      let selectedNode;
      data.forEach((inventory: TreeViewInventoryItem) => {
        inventory?.children?.forEach((group) => {
          group?.children?.forEach((host) => {
            if (host.id === nodeId) {
              selectedNode = host;
            }
          });
        });
      });

      if (selectedNode && onNodeSelected) {
        onNodeSelected(selectedNode);
      }
    }
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

  return (
    <TreeView
      expanded={expanded}
      selected={selected}
      onNodeToggle={handleToggle}
      onNodeSelect={handleSelect}
      sx={{ width: 250 }}
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
    >
      {data.map(renderTree)}
    </TreeView>
  );
};

export default ProjectDetailsTree;
