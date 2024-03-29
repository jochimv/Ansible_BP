/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 * Description: Contains util functions used by FileProcessorService. Functions are used for processing files and working with git.
 */

import { HostDetailsResponse, HostVariable, ProjectDetailsResponse, ProjectHosts } from '../types';
import * as path from 'path';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { parse as parseYaml, stringify } from 'yaml';
import { Response, simpleGit, SimpleGit } from 'simple-git';
import { parse as parseIni } from 'ini';
const { join, extname } = path;
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
export const getMainBranchName = async (git: SimpleGit): Promise<Response<string>> => await git.revparse(['--abbrev-ref', 'HEAD']);
const checkAndUpdateProject = async (projectPath: string) => {
  const git = await simpleGit(projectPath);
  const mainBranchName: string = await getMainBranchName(git)!;
  const diffResult = await git.diff([`origin/${mainBranchName}`]);

  if (diffResult) {
    await git.pull();
  }
};
const checkAndUpdateAllProjects = async (projectPaths: string[]) => {
  const tasks = projectPaths.map((path: string) => checkAndUpdateProject(path));
  await Promise.all(tasks);
};

const getGroupHosts = (inventoryFilePath: string, groupName: string): string[] => {
  const parsedIni = parseIniFile(inventoryFilePath);
  const iniGroupObj = parsedIni[groupName];

  const hosts: string[] = [];

  for (const hostnameKey in iniGroupObj) {
    const hostnameValue = iniGroupObj[hostnameKey];
    if (hostnameValue === true) {
      hosts.push(hostnameKey);
    } else {
      const hostname = hostnameValue.split('ansible_ssh_host=')[1];
      hosts.push(hostname);
    }
  }
  return [...new Set(hosts)];
};

export const getProjectDetails = async (projectName: string): Promise<ProjectDetailsResponse> => {
  const projectPath = join(process.env.ANSIBLE_REPOS_PATH, projectName);
  if (!existsSync(projectPath)) {
    return { projectExists: false, projectDetails: null };
  }

  await checkAndUpdateProject(projectPath);

  const inventoryFilesPaths = getInventoryFilesPaths(projectPath);
  const projectDetails = [];
  for (const inventoryFilePath of inventoryFilesPaths) {
    const inventoryPathFromRoot = removeAnsibleReposPathFromPath(inventoryFilePath);
    const inventoryType = getLastPathSegment(extractDirectoryPath(inventoryFilePath));
    const inventoryDirectoryPath = extractDirectoryPath(inventoryFilePath);
    const parsedIni = parseIniFile(inventoryFilePath);
    const iniGroups = Object.keys(parsedIni);

    const groupHosts = iniGroups.map((iniGroup: string) => {
      return {
        groupName: iniGroup,
        hosts: getGroupHosts(inventoryFilePath, iniGroup).map((hostname: string) => {
          const hostVarsFilePath = join(inventoryDirectoryPath, 'host_vars', `${hostname}.yml`);

          let hostValues;
          if (existsSync(hostVarsFilePath)) {
            hostValues = readFileSync(hostVarsFilePath, 'utf-8');
          }

          const groupName = getGroupNameFromIniInventory(inventoryFilePath, hostname)!;
          const baseGroupName = extractBeforeColon(groupName);

          const groupVarsFilePath = join(inventoryDirectoryPath, 'group_vars', `${baseGroupName}.yml`);
          let groupValues;
          if (existsSync(groupVarsFilePath)) {
            groupValues = readFileSync(groupVarsFilePath, 'utf-8');
          }

          const groupVarsDirectoryPath = join(inventoryDirectoryPath, 'group_vars');
          const commonVarsFilePath = join(groupVarsDirectoryPath, 'all', 'common.yml');
          const alternativeCommonVarsFilePath = join(groupVarsDirectoryPath, 'all.yml');

          let commonValues;
          if (existsSync(commonVarsFilePath)) {
            commonValues = readFileSync(commonVarsFilePath, 'utf-8').replace(/\r\n/g, '\n');
          } else if (existsSync(alternativeCommonVarsFilePath)) {
            commonValues = readFileSync(alternativeCommonVarsFilePath, 'utf-8').replace(/\r\n/g, '\n');
          }
          const appliedVariables = {
            ...(commonValues && parseYaml(commonValues)),
            ...(groupValues && parseYaml(groupValues)),
            ...(hostValues && parseYaml(hostValues)),
          };

          return {
            hostname,
            appliedVariables: stringify(appliedVariables),
          };
        }),
      };
    });
    projectDetails.push({ inventoryType, inventoryPath: inventoryPathFromRoot, groupHosts });
  }
  return { projectDetails, projectExists: true };
};
const extractHostsFromIniFile = (inventoryPath: string): string[] => {
  const hosts = [];
  const parsedIni = parseIniFile(inventoryPath);
  const iniGroups = Object.keys(parsedIni);
  for (const iniGroup of iniGroups) {
    const groupHosts: string[] = [];
    for (const hostnameKey in parsedIni[iniGroup]) {
      const hostnameValue = parsedIni[iniGroup][hostnameKey];
      if (hostnameValue === true) {
        groupHosts.push(hostnameKey);
      } else {
        const hostname = hostnameValue.split('ansible_ssh_host=')[1];
        groupHosts.push(hostname);
      }
    }
    hosts.push(...groupHosts);
  }
  return [...new Set(hosts)];
};
const parseYamlFile = (path: string): any => {
  const fileContent = readFileSync(path, 'utf-8');
  return parseYaml(fileContent);
};
const parseIniFile = (path: string): { [p: string]: any } => {
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
export const getProjectsHosts = async (): Promise<ProjectHosts[]> => {
  const projectsHosts = [];
  const projects = readdirSync(process.env.ANSIBLE_REPOS_PATH);
  const projectsPaths = projects.map((project) => join(process.env.ANSIBLE_REPOS_PATH, project));
  await checkAndUpdateAllProjects(projectsPaths);
  for (const project of projects) {
    const projectPath = join(process.env.ANSIBLE_REPOS_PATH, project);
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
const isIni = (inventoryPath: string): boolean => {
  const inventoryExtension = extname(inventoryPath);
  return inventoryExtension === '.ini' || inventoryExtension === '';
};
const extractHostsFromInventory = (inventoryPath: string): string[] => {
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
const extractDirectoryPath = (filePath: string): string => {
  const parts = filePath.split(/[\\/]/);
  parts.pop();
  return parts.join(path.sep);
};
const getLastPathSegment = (path: string): string => {
  const segments = path.split(/[\\/]/);
  return segments[segments.length - 1];
};
const getGroupNameFromIniInventory = (filePath: string, serverName: string): string | undefined => {
  const parsedIni = parseIniFile(filePath);
  const iniGroups = Object.keys(parsedIni);
  for (const iniGroup of iniGroups) {
    for (const hostnameKey in parsedIni[iniGroup]) {
      const hostnameValue = parsedIni[iniGroup][hostnameKey];
      if (hostnameValue === true || hostnameValue.split('ansible_ssh_host=')?.[1] === serverName) {
        return iniGroup;
      }
    }
  }
  return undefined;
};
const removeAnsibleReposPathFromPath = (filePath: string): string => {
  return path.relative(process.env.ANSIBLE_REPOS_PATH, filePath);
};
const extractBeforeColon = (str: string) => {
  const colonIndex = str.indexOf(':');

  if (colonIndex === -1) {
    return str;
  } else {
    return str.substring(0, colonIndex);
  }
};
const getCommonVariablesObj = (filePath: string): HostVariable => {
  return {
    type: 'common',
    pathInProject: removeAnsibleReposPathFromPath(filePath),
    // prevents bug when readFileSync puts \r\n as a new line character, whereas stringify from 'yaml' puts only \n. Then the diff editor shows empty diff as a result if unfixed.
    values: readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n'),
    // don't put "updated" key here as it causes original and updated variables not to match
  };
};
const getHostConfigInInventory = (hostname, inventoryFilePath) => {
  const inventoryDirectoryPath = extractDirectoryPath(inventoryFilePath);
  const inventoryType = getLastPathSegment(inventoryDirectoryPath);
  const hostVarsFilePath = join(inventoryDirectoryPath, 'host_vars', `${hostname}.yml`);
  const groupName = getGroupNameFromIniInventory(inventoryFilePath, hostname)!;
  const baseGroupName = extractBeforeColon(groupName);
  const groupVarsFilePath = join(inventoryDirectoryPath, 'group_vars', `${baseGroupName}.yml`);
  const groupVarsDirectoryPath = join(inventoryDirectoryPath, 'group_vars');
  const commonVarsFilePath = join(groupVarsDirectoryPath, 'all', 'common.yml');
  const alternativeCommonVarsFilePath = join(groupVarsDirectoryPath, 'all.yml');

  const variables = [];

  const hostVariables = existsSync(hostVarsFilePath)
    ? {
        type: 'host',
        pathInProject: removeAnsibleReposPathFromPath(hostVarsFilePath),
        values: readFileSync(hostVarsFilePath, 'utf-8').replace(/\r\n/g, '\n'),
        updated: false,
      }
    : null;

  const groupVariables = existsSync(groupVarsFilePath)
    ? {
        type: 'group',
        pathInProject: removeAnsibleReposPathFromPath(groupVarsFilePath),
        values: readFileSync(groupVarsFilePath, 'utf-8').replace(/\r\n/g, '\n'),
        updated: false,
      }
    : null;

  let commonVariables;
  if (existsSync(commonVarsFilePath)) {
    commonVariables = getCommonVariablesObj(commonVarsFilePath);
  } else if (existsSync(alternativeCommonVarsFilePath)) {
    commonVariables = getCommonVariablesObj(alternativeCommonVarsFilePath);
  }

  if (hostVariables) variables.push(hostVariables);
  if (groupVariables) variables.push(groupVariables);
  if (commonVariables) variables.push(commonVariables);

  const appliedVariables = {
    ...(commonVariables && parseYaml(commonVariables.values)),
    ...(groupVariables && parseYaml(groupVariables.values)),
    ...(hostVariables && parseYaml(hostVariables.values)),
  };

  variables.unshift({
    type: 'applied',
    pathInProject: 'Applied variables',
    values: stringify(appliedVariables),
    updated: false,
  });

  return {
    inventoryType,
    groupName,
    variables,
  };
};

export const getHostDetails = async (projectName: string, hostname: string): Promise<HostDetailsResponse> => {
  const projectPath: string = join(process.env.ANSIBLE_REPOS_PATH, projectName);

  if (!existsSync(projectPath)) {
    return { projectExists: false, hostDetailsByInventoryType: null, hostExists: false };
  }

  const inventoryFilesPaths = getInventoryFilesPaths(projectPath);
  const hostDetailsByInventoryType = [];
  let hostExists = false;

  for (const inventoryFilePath of inventoryFilesPaths) {
    const inventoryHosts = extractHostsFromInventory(inventoryFilePath);
    if (inventoryHosts.includes(hostname)) {
      hostExists = true;
      const hostConfig = getHostConfigInInventory(hostname, inventoryFilePath);
      hostDetailsByInventoryType.push(hostConfig);
    }
  }

  return { hostDetailsByInventoryType, hostExists, projectExists: true };
};
