import React from 'react';
import { TreeView, TreeItem } from '@mui/lab';
import { ExpandMore, ChevronRight } from '@mui/icons-material';

const generateFileTree = (paths) => {
  const fileTree = {};

  paths.forEach((path) => {
    const segments = path.split('\\').slice(1);
    let currentNode = fileTree;

    segments.forEach((segment, index) => {
      if (!currentNode[segment]) {
        currentNode[segment] = {};
      }

      if (index === segments.length - 1) {
        currentNode[segment].isLeaf = true;
      }

      currentNode = currentNode[segment];
    });
  });

  return fileTree;
};

const renderTree = (nodes) => {
  return Object.keys(nodes).map((key) => {
    const node = nodes[key];

    if (node.isLeaf) {
      return <TreeItem key={key} nodeId={key} label={key} />;
    }

    return (
      <TreeItem key={key} nodeId={key} label={key}>
        {renderTree(node)}
      </TreeItem>
    );
  });
};

const FileTree = ({ paths }) => {
  const fileTree = generateFileTree(paths);

  return (
    <TreeView defaultCollapseIcon={<ExpandMore />} defaultExpandIcon={<ChevronRight />}>
      {renderTree(fileTree)}
    </TreeView>
  );
};

export default FileTree;
