/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { Injectable } from '@nestjs/common';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';

import { join } from 'path';
import { SimpleGit, simpleGit } from 'simple-git';
import {
  CommitResponse,
  HostDetailsResponse,
  ProjectDetailsResponse,
  ProjectHosts,
  ProjectMainBranch,
  ProjectPlaybook,
  RepositoryActionResult,
} from '../types';
import { getHostDetails, getProjectDetails, getProjectsHosts } from '../utils';

const extractSecondToLastPathSegment = (url: string): string => {
  const urlSegments = url.split('/');
  return urlSegments[urlSegments.length - 2];
};

const addCredentialsToUrl = (username: string, password: string, url: string) => {
  const urlWithCredentials = new URL(url);
  urlWithCredentials.username = username;
  urlWithCredentials.password = password;
  return urlWithCredentials.href;
};

const removeCredentialsFromUrl = (urlWithCredentials) => {
  const urlWithoutCredentials = new URL(urlWithCredentials);
  urlWithoutCredentials.username = '';
  urlWithoutCredentials.password = '';
  return urlWithoutCredentials.href;
};

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
  getProjectDetails = async (projectName: string): Promise<ProjectDetailsResponse> => {
    return await getProjectDetails(projectName);
  };

  projectExists = (projectName: string): boolean => {
    const projectPath = join(process.env.ANSIBLE_REPOS_PATH, projectName);
    return existsSync(projectPath);
  };

  getProjectPlaybooks = async (projectName: string): Promise<ProjectPlaybook[]> => {
    const projectPath = join(process.env.ANSIBLE_REPOS_PATH, projectName);
    const playbookNames = readdirSync(projectPath).filter((name) => name.includes('playbook'));
    return playbookNames.map((playbookName: string) => {
      const fullPath = join(projectPath, playbookName);
      const content = readFileSync(fullPath, 'utf-8');
      return { playbookName, content };
    });
  };
  getMainBranchName = async (projectName: string): Promise<ProjectMainBranch> => {
    const projectPath = join(process.env.ANSIBLE_REPOS_PATH, projectName);
    if (!existsSync(projectPath)) {
      return {
        mainBranchName: null,
        projectExists: false,
      };
    }
    const git = await simpleGit(projectPath);
    const mainBranchName = await getMainBranchName(git);
    return { projectExists: true, mainBranchName };
  };
  getHostDetails = async (projectName: string, hostname: string): Promise<HostDetailsResponse> => {
    return await getHostDetails(projectName, hostname);
  };
  getProjectsHosts = async (): Promise<ProjectHosts[]> => {
    return await getProjectsHosts();
  };
  deleteRepository = async (projectName: string): Promise<RepositoryActionResult> => {
    const projectPath = join(process.env.ANSIBLE_REPOS_PATH, projectName);
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
  downloadRepository = async (gitRepositoryUrl: string): Promise<RepositoryActionResult> => {
    const git: SimpleGit = simpleGit();
    console.log('starting to download repository');
    try {
      const projectName = extractSecondToLastPathSegment(gitRepositoryUrl);
      const projectDestinationPath = join(process.env.ANSIBLE_REPOS_PATH, projectName);

      if (existsSync(projectDestinationPath)) {
        return { success: false, error: `${projectName} already present` };
      }

      await git.clone(gitRepositoryUrl, projectDestinationPath);
      return { success: true };
    } catch (error) {
      console.error('Error downloading repository:', error.message);
      return {
        success: false,
        error: 'Failed to download repository. Check internet connection and URL.',
      };
    }
  };

  async commit(commitDto): Promise<CommitResponse> {
    const { commitMessage, commitBranchName, projectName, updatedVars } = commitDto;
    const repositoryPath = join(process.env.ANSIBLE_REPOS_PATH, projectName);
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
    try {
      await git.checkoutBranch(commitBranchName, originalBranchName);
    } catch (e) {
      return { error: e.message };
    }
    for (const updatedVar of updatedVars) {
      const { pathInProject, values } = updatedVar;
      const fullPath = join(process.env.ANSIBLE_REPOS_PATH, pathInProject);
      writeFileSync(fullPath, values);
    }

    await git.add('./*').commit(commitMessage);

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
      try {
        await git.checkout(originalBranchName).deleteLocalBranch(commitBranchName, true);
      } catch (e) {
        return { error: error.message };
      }
      error.task.commands[1] = removeCredentialsFromUrl(remoteRepoUrl);
      return { error: error.message };
    }
  }
}
