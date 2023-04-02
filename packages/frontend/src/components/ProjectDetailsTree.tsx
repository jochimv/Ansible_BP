import React, { useState } from 'react';
import { TreeView, TreeItem } from '@mui/lab';
import { faServer } from '@fortawesome/free-solid-svg-icons';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
const ProjectDetailsTree = ({ data, onNodeSelected }) => {
  const [expanded, setExpanded] = useState<string[]>(['inventory-0', 'group-0-0']);
  const [selected, setSelected] = useState<string[]>(['host-0-0-0']);

  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  const handleSelect = (event: React.SyntheticEvent, nodeIds: string[]) => {
    if (nodeIds.startsWith('host-')) {
      setSelected(nodeIds);

      let selectedNode;
      data.forEach((inventory) => {
        inventory.children.forEach((group) => {
          group.children.forEach((host) => {
            if (host.id === nodeIds) {
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
  const renderTree = (nodes) => {
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
