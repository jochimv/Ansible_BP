import { Injectable } from '@nestjs/common';
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync, rmSync } from 'fs';
import { parse as parseIni } from 'ini';
import { parse as parseYaml } from 'yaml';
import { extname, join } from 'path';
import { ProjectsHosts } from '../types';
import { SimpleGit, simpleGit } from 'simple-git';
export interface CommitResponse {
  error: string | boolean;
  pullRequestUrl?: any;
}
const extractSecondToLastPathSegment = (url: string): string => {
  const urlSegments = url.split('/');
  return urlSegments[urlSegments.length - 2];
};

function addCredentialsToUrl(username, password, url) {
  const urlWithCredentials = new URL(url);
  urlWithCredentials.username = username;
  urlWithCredentials.password = password;
  return urlWithCredentials.href;
}

const removeCredentialsFromUrl = (urlWithCredentials) => {
  const urlWithoutCredentials = new URL(urlWithCredentials);
  urlWithoutCredentials.username = '';
  urlWithoutCredentials.password = '';
  return urlWithoutCredentials.href;
};

export interface DownloadRepositoryResult {
  success: boolean;
  error?: string;
}

// todo - ozkoušet tohle jestli to funguje, a odstranit duplikát na frontendu v utils
export const getMainBranchName = async (git): Promise<string> => {
  try {
    return await git.revparse(['--abbrev-ref', 'HEAD']);
  } catch (error) {
    console.log('Error during getting the main branch name', error);
    return null;
  }
};

@Injectable()
export class FileProcessorService {
  private ansibleReposPath =
    'C:\\Users\\VJochim\\Desktop\\Ansible_BP\\packages\\backend\\ansible_repos'; // "/app/ansible_repos" inside docker container
  private possibleInventoryFiles = ['hosts.ini', 'hosts', 'hosts.yaml'];
  private directoriesToIgnore = [
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

  deleteRepository = async (projectName: string): Promise<DownloadRepositoryResult> => {
    const projectPath = join(this.ansibleReposPath, projectName);
    if (!existsSync(projectPath)) {
      return { success: false, error: `${projectName} not found` };
    }

    try {
      await rmSync(projectPath, { recursive: true, force: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: `Error during removal of ${projectPath}` };
    }
  };
  downloadRepository = async (gitRepositoryUrl: string): Promise<DownloadRepositoryResult> => {
    const git: SimpleGit = simpleGit();
    console.log('starting to download repository');
    try {
      const projectName = extractSecondToLastPathSegment(gitRepositoryUrl);
      console.log('projectName: ', projectName);
      const projectDestinationPath = join(this.ansibleReposPath, projectName);

      if (existsSync(projectDestinationPath)) {
        return { success: false, error: `${projectName} already present` };
      }

      const result = await git.clone(gitRepositoryUrl, projectDestinationPath);
      console.log('downloading completed', JSON.stringify(result));
      return { success: true };
    } catch (error) {
      console.error('Error downloading repository:', JSON.stringify(error));
      return {
        success: false,
        error: 'Failed to download repository. Check internet connection and URL.',
      };
    }
  };

  async commit(commitDto): Promise<CommitResponse> {
    const { commitMessage, commitBranchName, projectName, updatedVars } = commitDto;
    const repositoryPath = join(this.ansibleReposPath, projectName);
    const git = await simpleGit(repositoryPath);
    let remoteRepoUrl;
    await git.getRemotes(true, (err, remotes) => {
      if (err) {
        console.error(err);
        return;
      }
      remoteRepoUrl = remotes.map((remote) => remote.refs.fetch)[0];
    });

    const originalBranchName = await getMainBranchName(git);

    await git.checkoutBranch(commitBranchName, originalBranchName);
    for (const updatedVar of updatedVars) {
      const { pathInProject, values } = updatedVar;
      const fullPath = join(this.ansibleReposPath, pathInProject);
      writeFileSync(fullPath, values);
      await git.add(fullPath);
    }

    await git.commit(commitMessage);

    const repositoryUrlWithCredentials = addCredentialsToUrl(
      process.env.GIT_USERNAME,
      process.env.GIT_PASSWORD,
      remoteRepoUrl,
    );
    try {
      const response = await git.push(repositoryUrlWithCredentials, commitBranchName);
      const pullRequestUrl = response.remoteMessages.all[1];
      await git.checkout(originalBranchName).deleteLocalBranch(commitBranchName, true);
      return { error: false, pullRequestUrl };
    } catch (error) {
      console.log('error caught while push, now about to try deleting local branch');
      try {
        await git.checkout(originalBranchName).deleteLocalBranch(commitBranchName, true);
        console.log('branch deleted successfully');
      } catch (e) {
        console.log('unable to delete local branch. Error: ', JSON.stringify(e));
        return { error: `Failed to push: ${JSON.stringify(error)}` };
      }
      error.task.commands[1] = removeCredentialsFromUrl(remoteRepoUrl);
      return { error: `Failed to push: ${JSON.stringify(error)}` };
    }
  }

  extractHostsFromIniFile(iniFileContent): string[] {
    const hosts = [];
    const parsedIni = parseIni(iniFileContent);
    const iniGroups = Object.keys(parsedIni);
    for (const iniGroup of iniGroups) {
      const groupHosts = Object.keys(parsedIni[iniGroup]);
      hosts.push(...groupHosts);
    }
    return [...new Set(hosts)];
  }

  extractHostsFromYamlFile(yamlFileContent): string[] {
    const hosts = [];
    const parsedYaml = parseYaml(yamlFileContent);
    function extractHosts(yamlData) {
      if (yamlData && typeof yamlData === 'object') {
        if (yamlData.hosts) {
          hosts.push(...Object.keys(yamlData.hosts));
        }
        for (const childKey in yamlData) {
          extractHosts(yamlData[childKey]);
        }
      }
    }
    extractHosts(parsedYaml);
    return [...new Set(hosts)];
  }

  removeDuplicateHosts(arr) {
    return arr.map(function (item) {
      item.hosts = Array.from(new Set(item.hosts));
      return item;
    });
  }

  getProjectsHosts(): ProjectsHosts {
    const projectsHosts = [];
    const projects = readdirSync(this.ansibleReposPath);

    for (const project of projects) {
      const projectPath = join(this.ansibleReposPath, project);
      const inventoryPaths = this.getInventoryFilesPaths(projectPath);

      const hosts = [];
      for (const inventoryPath of inventoryPaths) {
        const inventoryExtension = extname(inventoryPath);
        const fileContent = readFileSync(inventoryPath, 'utf-8');
        if (inventoryExtension === '.ini' || inventoryExtension === '') {
          const inventoryHosts = this.extractHostsFromIniFile(fileContent);
          hosts.push(...inventoryHosts);
        } else {
          const inventoryHosts = this.extractHostsFromYamlFile(fileContent);
          hosts.push(...inventoryHosts);
        }
      }
      projectsHosts.push({ project, hosts });
    }
    return this.removeDuplicateHosts(projectsHosts);
  }

  getInventoryFilesPaths(dir): string[] {
    const files = readdirSync(dir);

    let inventoryFilesPaths = [];

    for (const file of files) {
      if (this.directoriesToIgnore.includes(file)) {
        continue;
      }
      const filePath = join(dir, file);
      if (statSync(filePath).isDirectory()) {
        inventoryFilesPaths = inventoryFilesPaths.concat(this.getInventoryFilesPaths(filePath));
      } else {
        if (this.possibleInventoryFiles.includes(file)) {
          inventoryFilesPaths.push(filePath);
        }
      }
    }
    return inventoryFilesPaths;
  }
}
