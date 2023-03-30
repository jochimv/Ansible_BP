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
  const { originalVars, originalDiff, selectedProjectName } = useCodeChangesContext();

  const dispatch = useCodeChangesDispatchContext();
  // todo: problém je v tom, že po načtení není načtený project ani host do něj. Čili když upravím jednu věc a pak druhou v jiném projektu, nenačte se v git page
  const paths = originalVars
    .map((originalVar) => originalVar.pathInProject)
    // only show diff for the current project
    .filter((path) => path.split('\\')[1] === selectedProjectName);

  const treeData = buildTree(paths);
  const selectedNodeId = originalDiff.pathInProject || paths[0];

  const allPaths = paths.flatMap((path) => getPathHierarchy(path));
  const [expanded, setExpanded] = useState<string[]>(allPaths);

  const handleToggle = (event, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  console.log('selectedNodeId is ', selectedNodeId);
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
