import { Dispatch, SyntheticEvent, useState } from 'react';
import { TreeView, TreeItem } from '@mui/lab';
import { Folder, Description } from '@mui/icons-material';
import {
  useCodeChangesContext,
  useCodeChangesDispatchContext,
} from '../context/CodeChangesContext';
import { showDiff } from '../reducers/codeChangesReducer';
import { HostVariable } from '@frontend/types';
interface TreeNode {
  [key: string]: TreeNode | undefined;
}

const buildTree = (paths: string[]): TreeNode => {
  const tree: TreeNode = {};

  for (const path of paths) {
    const parts = path.split('\\');
    let currentNode: TreeNode = tree;

    for (const part of parts) {
      if (!currentNode[part]) {
        currentNode[part] = {};
      }
      currentNode = currentNode[part]!;
    }
  }
  return tree;
};

const renderTree = (nodes: TreeNode | undefined, path: string, dispatch: Dispatch<any>) => {
  if (Object.keys(nodes ?? {}).length === 0) {
    return <div />;
  }
  return Object.entries(nodes ?? {}).map(([nodeName, children]) => {
    const newPath = path === '' ? nodeName : `${path}\\${nodeName}`;
    const isLeaf = Object.keys(children ?? {}).length === 0;
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

const getPathHierarchy = (path: string) => {
  const parts = path.split('\\');
  const result = [];

  let currentPath = '';

  for (let i = 0; i < parts.length; i++) {
    currentPath += parts[i];
    result.push(currentPath);
    currentPath += '\\';
  }

  return result;
};

const GitChangesFileTree = () => {
  const { originalVars, originalDiff, selectedProjectName } = useCodeChangesContext();

  const dispatch = useCodeChangesDispatchContext();

  const paths =
    originalVars
      ?.map((originalVar: HostVariable) => originalVar.pathInProject)
      // only show diff for the current project
      .filter((path: string) => path.split('\\')[0] === selectedProjectName) || [];
  const treeData = buildTree(paths);
  const selectedNodeId = originalDiff?.pathInProject || paths[0];
  const allPaths = paths?.flatMap((path) => getPathHierarchy(path));
  const [expanded, setExpanded] = useState<string[]>(allPaths);
  const handleToggle = (event: SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  return (
    <TreeView
      sx={{ width: '100%' }}
      expanded={expanded}
      selected={selectedNodeId}
      defaultCollapseIcon={<Folder />}
      onNodeToggle={handleToggle}
      defaultExpandIcon={<Folder />}
      defaultEndIcon={<Description />}
    >
      {renderTree(treeData, '', dispatch)}
    </TreeView>
  );
};

export default GitChangesFileTree;
