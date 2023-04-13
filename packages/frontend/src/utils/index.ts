import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { parse as parseIni } from 'ini';
import { parse as parseYaml, stringify } from 'yaml';
import { extname, join } from 'path';
import { SimpleGit, simpleGit } from 'simple-git';

export const ansibleReposPath =
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

export const getMainBranchName = async (git: SimpleGit) =>
  await git.revparse(['--abbrev-ref', 'HEAD']);

const checkAndUpdateProject = async (projectPath: string) => {
  const git = await simpleGit(projectPath);
  const mainBranchName: string = await getMainBranchName(git)!;
  const diffResult = await git.diff(['origin', mainBranchName]);

  if (diffResult) {
    await git.pull();
  }
};

const checkAndUpdateAllProjects = async (projectPaths: string[]) => {
  const tasks = projectPaths.map((path) => checkAndUpdateProject(path));
  await Promise.all(tasks);
};

export const getProjectDetails = async (projectName: string) => {
  const projectPath = join(ansibleReposPath, projectName);
  if (!existsSync(projectPath)) {
    return { projectExists: false, projectDetails: null };
  }

  await checkAndUpdateProject(projectPath);

  const inventoryFilesPaths = getInventoryFilesPaths(projectPath);
  const projectDetails = [];

  for (const inventoryFilePath of inventoryFilesPaths) {
    const inventoryType = getLastPathSegment(extractDirectoryPath(inventoryFilePath));
    const inventoryDirectoryPath = extractDirectoryPath(inventoryFilePath);
    const fileContent = readFileSync(inventoryFilePath, 'utf-8');
    const parsedIni = parseIni(fileContent);
    const iniGroups = Object.keys(parsedIni);

    const groupHosts = iniGroups.map((iniGroup: string) => {
      return {
        groupName: iniGroup,
        hosts: Object.keys(parsedIni[iniGroup]).map((hostname: string) => {
          const hostVarsFilePath = join(inventoryDirectoryPath, 'host_vars', `${hostname}.yml`);

          let hostValues;
          if (existsSync(hostVarsFilePath)) {
            hostValues = readFileSync(hostVarsFilePath, 'utf-8');
          }

          const groupName = getGroupNameFromIniInventory(inventoryFilePath, hostname)!;
          const baseGroupName = extractBeforeColon(groupName);

          const groupVarsFilePath = join(
            inventoryDirectoryPath,
            'group_vars',
            `${baseGroupName}.yml`,
          );
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
            commonValues = readFileSync(alternativeCommonVarsFilePath, 'utf-8').replace(
              /\r\n/g,
              '\n',
            );
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
    projectDetails.push({ inventoryType, groupHosts });
  }
  return { projectDetails, projectExists: true };
};

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

export const getProjectsHosts = async () => {
  const projectsHosts = [];
  const projects = readdirSync(ansibleReposPath);

  const projectsPaths = projects.map((project) => join(ansibleReposPath, project));
  await checkAndUpdateAllProjects(projectsPaths);
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

const extractDirectoryPath = (filePath: string): string => {
  const parts = filePath.split('\\');
  parts.pop();
  return parts.join('\\');
};

const getLastPathSegment = (path: string): string => {
  const segments = path.split(/[\\/]/); // split path by forward slash or backslash
  return segments[segments.length - 1]; // return the last segment
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

const extractBeforeColon = (str: string) => {
  // find the index of the first colon in the string
  const colonIndex = str.indexOf(':');

  if (colonIndex === -1) {
    // if the colon is not found, return the entire string
    return str;
  } else {
    // extract the substring before the colon
    return str.substring(0, colonIndex);
  }
};

const getCommonVariablesObj = (filePath: string) => {
  return {
    type: 'common',
    pathInProject: removeAnsibleReposPathFromPath(filePath),
    // prevents bug when readFileSync puts \r\n as a new line character, whereas stringify from 'yaml' puts only \n. Then the diff editor shows empty diff as a result if unfixed.
    values: readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n'),
    // don't put "updated" key here as it causes original and updated variables not to match
  };
};

export const getHostDetails = async (projectName: string, hostName: string) => {
  const projectPath = join(ansibleReposPath, projectName);

  if (!existsSync(projectPath)) {
    return { projectExists: false, hostDetailsByInventoryType: null, hostExists: false };
  }

  await checkAndUpdateProject(projectPath);

  const inventoryFilesPaths = getInventoryFilesPaths(projectPath);
  const hostDetailsByInventoryType = [];
  let hostExists = false;
  for (const inventoryFilePath of inventoryFilesPaths) {
    const inventoryHosts = extractHostsFromInventory(inventoryFilePath);
    if (inventoryHosts.includes(hostName)) {
      hostExists = true;

      const variables = [];
      const inventoryDirectoryPath = extractDirectoryPath(inventoryFilePath);
      const inventoryType = getLastPathSegment(inventoryDirectoryPath);

      const hostVarsFilePath = join(inventoryDirectoryPath, 'host_vars', `${hostName}.yml`);

      let hostVariables;
      if (existsSync(hostVarsFilePath)) {
        hostVariables = {
          type: 'host',
          pathInProject: removeAnsibleReposPathFromPath(hostVarsFilePath),
          values: readFileSync(hostVarsFilePath, 'utf-8').replace(/\r\n/g, '\n'),
          updated: false,
        };
        variables.push(hostVariables);
      }
      const groupName = getGroupNameFromIniInventory(inventoryFilePath, hostName)!;
      // because some groups have name "foo:children," which will be displayed to the user, but the variables are placed in file foo.yml (without ":children")
      const baseGroupName = extractBeforeColon(groupName);

      const groupVarsFilePath = join(inventoryDirectoryPath, 'group_vars', `${baseGroupName}.yml`);
      let groupVariables;
      if (existsSync(groupVarsFilePath)) {
        groupVariables = {
          type: 'group',
          pathInProject: removeAnsibleReposPathFromPath(groupVarsFilePath),
          values: readFileSync(groupVarsFilePath, 'utf-8').replace(/\r\n/g, '\n'),
          updated: false,
        };
        variables.push(groupVariables);
      }

      const groupVarsDirectoryPath: string = join(inventoryDirectoryPath, 'group_vars');
      const commonVarsFilePath: string = join(groupVarsDirectoryPath, 'all', 'common.yml');
      const alternativeCommonVarsFilePath: string = join(groupVarsDirectoryPath, 'all.yml');

      let commonVariables;
      if (existsSync(commonVarsFilePath)) {
        commonVariables = getCommonVariablesObj(commonVarsFilePath);
        variables.push(commonVariables);
      } else if (existsSync(alternativeCommonVarsFilePath)) {
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
        updated: false,
      });
      hostDetailsByInventoryType.push({
        inventoryType,
        groupName,
        variables,
      });
      break;
    }
  }
  return { hostDetailsByInventoryType, hostExists, projectExists: true };
};
export const extractRepoNameFromUrl = (gitRepoUrl: string): string => {
  const urlParts = gitRepoUrl.split('/');
  const repoNameWithGit = urlParts[urlParts.length - 1];
  return repoNameWithGit.replace('.git', '');
};
