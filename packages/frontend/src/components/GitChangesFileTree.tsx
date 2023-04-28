import { Dispatch, SyntheticEvent, useState } from 'react';
import { TreeView, TreeItem } from '@mui/lab';
import { Folder, Description } from '@mui/icons-material';
import { useCodeChangesDispatchContext } from '../context/CodeChangesContext';
import { showDiff } from '../reducers/codeChangesReducer';
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

const getPathHierarchy = (path: string): string[] => {
  const parts = path.split('\\');
  const result: string[] = [];

  let currentPath = '';

  for (let i = 0; i < parts.length; i++) {
    currentPath += parts[i];
    result.push(currentPath);
    currentPath += '\\';
  }

  return result;
};

interface GitChangesFileTreeProps {
  selectedNodeId: string;
  paths: string[];
}

const GitChangesFileTree = ({ selectedNodeId, paths }: GitChangesFileTreeProps) => {
  const dispatch = useCodeChangesDispatchContext();

  const treeData = buildTree(paths);
  const allPaths = Array.from(new Set(paths?.flatMap((path: string) => getPathHierarchy(path))));
  const [expanded, setExpanded] = useState<string[]>(allPaths);
  const handleToggle = (event: SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds);
  };

  return (
    <TreeView
      sx={{ width: '100%' }}
      expanded={expanded}
      defaultExpanded={allPaths}
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
