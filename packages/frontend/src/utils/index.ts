import { readdirSync, statSync, readFileSync, accessSync, constants } from 'fs';
import { parse as parseIni } from 'ini';
import { parse as parseYaml, stringify } from 'yaml';
import { extname, join } from 'path';
import { ProjectsHosts } from '@backend/types';

const ansibleReposPath =
  'C:\\Users\\VJochim\\Desktop\\Ansible_BP\\packages\\backend\\ansible_repos'; // "/app/ansible_repos" inside docker container
const possibleInventoryFiles = ['hosts.ini', 'hosts', 'hosts.yaml'];
const directoriesToIgnore = [
  'roles',
  'utils',
  '.githooks',
  'certs',
  'templates',
  'vars',
  'assets',
  'env',
  'modules',
  '.git',
  'group_vars',
  'host_vars',
];

const extractHostsFromIniFile = (inventoryPath: string): string[] => {
  const hosts = [];
  const fileContent = readFileSync(inventoryPath, 'utf-8');
  const parsedIni = parseIni(fileContent);

  const iniGroups = Object.keys(parsedIni);

  for (const iniGroup of iniGroups) {
    const groupHosts = Object.keys(parsedIni[iniGroup]);
    hosts.push(...groupHosts);
  }
  return [...new Set(hosts)];
};

const parseYamlFile = (path: string) => {
  const fileContent = readFileSync(path, 'utf-8');
  return parseYaml(fileContent);
};

const parseIniFile = (path: string) => {
  const fileContent = readFileSync(path, 'utf-8');
  return parseIni(fileContent);
};

const extractHostsFromYamlFile = (inventoryPath: string): string[] => {
  const parsedYaml = parseYamlFile(inventoryPath);
  const hosts: string[] = [];
  const extractHosts = (yamlData: any) => {
    if (yamlData && typeof yamlData === 'object') {
      if (yamlData.hosts) {
        hosts.push(...Object.keys(yamlData.hosts));
      }
      for (const childKey in yamlData) {
        extractHosts(yamlData[childKey]);
      }
    }
  };
  extractHosts(parsedYaml);
  return [...new Set(hosts)];
};

const removeDuplicateHosts = (arr: any) => {
  return arr.map((item: any) => {
    item.hosts = Array.from(new Set(item.hosts));
    return item;
  });
};

const isIni = (inventoryPath: string) => {
  const inventoryExtension = extname(inventoryPath);
  return inventoryExtension === '.ini' || inventoryExtension === '';
};
export const getProjectsHosts = (): ProjectsHosts => {
  const projectsHosts = [];
  const projects = readdirSync(ansibleReposPath);

  for (const project of projects) {
    const projectPath = join(ansibleReposPath, project);
    const inventoryPaths = getInventoryFilesPaths(projectPath);

    const hosts = [];
    for (const inventoryPath of inventoryPaths) {
      const inventoryHosts = extractHostsFromInventory(inventoryPath);
      hosts.push(...inventoryHosts);
    }
    projectsHosts.push({ project, hosts });
  }
  return removeDuplicateHosts(projectsHosts);
};

const extractHostsFromInventory = (inventoryPath: string) => {
  if (isIni(inventoryPath)) {
    return extractHostsFromIniFile(inventoryPath);
  } else {
    return extractHostsFromYamlFile(inventoryPath);
  }
};

const getInventoryFilesPaths = (dir: string): string[] => {
  const files = readdirSync(dir);

  let inventoryFilesPaths: string[] = [];

  for (const file of files) {
    if (directoriesToIgnore.includes(file)) {
      continue;
    }
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      inventoryFilesPaths = inventoryFilesPaths.concat(getInventoryFilesPaths(filePath));
    } else {
      if (possibleInventoryFiles.includes(file)) {
        inventoryFilesPaths.push(filePath);
      }
    }
  }
  return inventoryFilesPaths;
};

const getFileDirectory = (filePath: string): string => {
  const parts = filePath.split('\\');
  parts.pop();
  return parts.join('\\');
};

const getLastPathSegment = (path: string): string => {
  const segments = path.split(/[\\/]/); // split path by forward slash or backslash
  return segments[segments.length - 1]; // return the last segment
};

const fileExists = (path: string): boolean => {
  try {
    accessSync(path, constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
};

const getGroupNameFromIniInventory = (filePath: string, serverName: string): string | undefined => {
  const iniData = parseIniFile(filePath);
  for (const groupName in iniData) {
    if (iniData[groupName][serverName]) {
      return groupName;
    }
  }
  return undefined;
};

const removeAnsibleReposPathFromPath = (filePath: string): string => {
  return filePath.slice(ansibleReposPath.length);
};

function extractBeforeColon(str) {
  // find the index of the first colon in the string
  const colonIndex = str.indexOf(':');

  if (colonIndex === -1) {
    // if the colon is not found, return the entire string
    return str;
  } else {
    // extract the substring before the colon
    return str.substring(0, colonIndex);
  }
}

const getCommonVariablesObj = (filePath) => {
  return {
    type: 'common',
    pathInProject: removeAnsibleReposPathFromPath(filePath),
    values: readFileSync(filePath, 'utf-8'),
  };
};

export const getHostDetails = (projectName: string, hostName: string) => {
  const projectPath = join(ansibleReposPath, projectName);
  const inventoryFilesPaths = getInventoryFilesPaths(projectPath);
  const projectHostDetails = [];
  for (const inventoryFilePath of inventoryFilesPaths) {
    const inventoryHosts = extractHostsFromInventory(inventoryFilePath);
    if (inventoryHosts.includes(hostName)) {
      const variables = [];
      const inventoryDirectoryPath = getFileDirectory(inventoryFilePath);
      const inventoryType = getLastPathSegment(inventoryDirectoryPath);

      const hostVarsFilePath = join(inventoryDirectoryPath, 'host_vars', `${hostName}.yml`);

      let hostVariables;
      if (fileExists(hostVarsFilePath)) {
        hostVariables = {
          type: 'host',
          pathInProject: removeAnsibleReposPathFromPath(hostVarsFilePath),
          values: readFileSync(hostVarsFilePath, 'utf-8'),
        };
        variables.push(hostVariables);
      }
      const groupName = getGroupNameFromIniInventory(inventoryFilePath, hostName);
      // because some groups have name "foo:children," which will be displayed to the user, but the variables are placed in file foo.yml (without ":children")
      const baseGroupName = extractBeforeColon(groupName);

      const groupVarsFilePath = join(inventoryDirectoryPath, 'group_vars', `${baseGroupName}.yml`);
      let groupVariables;
      if (fileExists(groupVarsFilePath)) {
        groupVariables = {
          type: 'group',
          pathInProject: removeAnsibleReposPathFromPath(groupVarsFilePath),
          values: readFileSync(groupVarsFilePath, 'utf-8'),
        };
        variables.push(groupVariables);
      }

      const groupVarsDirectoryPath = join(inventoryDirectoryPath, 'group_vars');
      const commonVarsFilePath = join(groupVarsDirectoryPath, 'all', 'common.yml');
      const alternativeCommonVarsFilePath = join(groupVarsDirectoryPath, 'all.yml');

      let commonVariables;
      if (fileExists(commonVarsFilePath)) {
        commonVariables = getCommonVariablesObj(commonVarsFilePath);
        variables.push(commonVariables);
      } else if (fileExists(alternativeCommonVarsFilePath)) {
        commonVariables = getCommonVariablesObj(alternativeCommonVarsFilePath);
        variables.push(commonVariables);
      }
      const appliedVariables = {
        ...(commonVariables && parseYaml(commonVariables.values)),
        ...(groupVariables && parseYaml(groupVariables.values)),
        ...(hostVariables && parseYaml(hostVariables.values)),
      };
      variables.unshift({
        type: 'applied',
        pathInProject: 'Read only',
        values: stringify(appliedVariables),
      });
      projectHostDetails.push({
        inventoryType,
        groupName,
        variables,
      });
    }
  }
  return projectHostDetails;
};
