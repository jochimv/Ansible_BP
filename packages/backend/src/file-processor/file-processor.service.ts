import { Injectable } from '@nestjs/common';
import { readdirSync, statSync, readFileSync } from 'fs';
import { parse as parseIni } from 'ini';
import { parse as parseYaml } from 'yaml';
import { extname, join } from 'path';
import { ProjectsHosts } from '../types';
import { writeFileSync } from 'fs';
import { simpleGit } from 'simple-git';

export interface CommitResponse {
  error: string | boolean;
  pullRequestUrl?: any;
}

function addCredentialsToUrl(username, password, url) {
  const urlWithCredentials = new URL(url);
  urlWithCredentials.username = username;
  urlWithCredentials.password = password;
  return urlWithCredentials.href;
}

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

  async commit(commitDto): Promise<CommitResponse> {
    const { commitMessage, commitBranchName, projectName, updatedVars } = commitDto;
    const repositoryPath = join(this.ansibleReposPath, projectName);
    const git = await simpleGit(repositoryPath);
    // todo - vyřešit stejné jméno branch
    let remoteRepoUrl;
    await git.getRemotes(true, (err, remotes) => {
      if (err) {
        console.error(err);
        return;
      }
      remoteRepoUrl = remotes.map((remote) => remote.refs.fetch)[0];
    });
    const repositoryUrlWithCredentials = addCredentialsToUrl(
      process.env.GIT_USERNAME,
      process.env.GIT_PASSWORD,
      remoteRepoUrl,
    );

    let originalBranchName;
    await git.branch(['--all'], (error, result) => {
      if (error) {
        console.log('Error during listing branches', error);
      } else {
        const { all: branchNames, branches } = result;
        for (const branchName of branchNames) {
          const { current, name } = branches[branchName];
          if (current) {
            originalBranchName = name;
            break;
          }
        }
      }
    });

    await git.checkoutBranch(commitBranchName, originalBranchName);
    for (const updatedVar of updatedVars) {
      const { pathInProject, values } = updatedVar;
      const fullPath = join(this.ansibleReposPath, pathInProject);
      writeFileSync(fullPath, values);
      await git.add(fullPath);
    }

    await git.commit(commitMessage);

    try {
      const response = await git.push(repositoryUrlWithCredentials, commitBranchName);
      const pullRequestUrl = response.remoteMessages.all[1];
      await git.checkout(originalBranchName).deleteLocalBranch(commitBranchName, true);
      return { error: false, pullRequestUrl };
    } catch (error) {
      console.log('Could not push.');
      await git.checkout(originalBranchName).deleteLocalBranch(commitBranchName, true);
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
