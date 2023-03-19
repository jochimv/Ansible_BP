import { useState } from 'react';
import { TreeView, TreeItem } from '@mui/lab';
import { Folder, Description } from '@mui/icons-material';
import { useCodeChangesContext, useCodeChangesDispatchContext } from '../context/context';
import { showDiff } from '../context/reducer';

const buildTree = (paths: string[]) => {
  const tree = {};

  for (const path of paths) {
    const parts = path.split('\\').slice(1);
    let currentNode = tree;

    for (const part of parts) {
      if (!currentNode[part]) {
        currentNode[part] = {};
      }
      currentNode = currentNode[part];
    }
  }
  return tree;
};

const renderTree = (nodes, path: string, dispatch) => {
  if (Object.keys(nodes).length === 0) {
    return;
  }

  return Object.entries(nodes).map(([nodeName, children]) => {
    const newPath = `${path}\\${nodeName}`;
    const isLeaf = Object.keys(children).length === 0;
    console.log('node path:', newPath);
    return (
      <TreeItem
        key={newPath}
        nodeId={newPath}
        label={nodeName}
        onClick={isLeaf ? () => dispatch(showDiff(newPath)) : undefined}
        icon={
          isLeaf ? (
            <Description sx={{ color: 'primary.main' }} />
          ) : (
            <Folder sx={{ color: 'gray' }} />
          )
        }
      >
        {renderTree(children, newPath, dispatch)}
      </TreeItem>
    );
  });
};

function getPathHierarchy(path) {
  const parts = path.split('\\');
  const result = [];

  let currentPath = '';

  for (let i = 0; i < parts.length; i++) {
    currentPath += parts[i];
    result.push(currentPath);
    currentPath += '\\';
  }

  return result;
}

const FileTree = () => {
  const { oldVars, oldDiff } = useCodeChangesContext();
  const dispatch = useCodeChangesDispatchContext();
  const paths = oldVars.map((oldVars) => oldVars.pathInProject);
  const treeData = buildTree(paths);
  const selectedNodeId = oldDiff.pathInProject || paths[0];

  const allPaths = paths.flatMap((path) => getPathHierarchy(path));
  const [expanded, setExpanded] = useState<string[]>(allPaths);

  const handleToggle = (event, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  return (
    <TreeView
      expanded={expanded}
      selected={selectedNodeId}
      defaultCollapseIcon={<Folder open />}
      onNodeToggle={handleToggle}
      defaultExpandIcon={<Folder />}
      defaultEndIcon={<Description />}
    >
      {renderTree(treeData, '', dispatch)}
    </TreeView>
  );
};

export default FileTree;
