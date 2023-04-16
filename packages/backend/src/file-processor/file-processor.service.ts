import { Injectable } from '@nestjs/common';
import { writeFileSync, existsSync, rmSync, readdirSync, readFileSync } from 'fs';

import { join } from 'path';
import { SimpleGit, simpleGit } from 'simple-git';
import { ansibleReposPath, getHostDetails, getProjectDetails, getProjectsHosts } from './utils';
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
  getProjectDetails = async (projectName: string) => {
    return await getProjectDetails(projectName);
  };

  getProjectPlaybooks = async (projectName: string) => {
    const projectPath = join(ansibleReposPath, projectName);
    const playbookNames = readdirSync(projectPath).filter((name) => name.includes('playbook'));
    return playbookNames.map((playbookName: string) => {
      const fullPath = join(projectPath, playbookName);
      const content = readFileSync(fullPath, 'utf-8');
      return { playbookName, content };
    });
  };
  getMainBranchName = async (projectName: string) => {
    const projectPath = join(ansibleReposPath, projectName);
    if (!existsSync(projectPath)) {
      return {
        props: { mainBranchName: null, projectExists: false },
      };
    }
    const git = await simpleGit(projectPath);
    const mainBranchName = await getMainBranchName(git);
    return { projectExists: true, mainBranchName };
  };
  getHostDetails = async (projectName: string, hostname: string) => {
    return await getHostDetails(projectName, hostname);
  };
  getProjectsHosts = async () => {
    return await getProjectsHosts();
  };
  deleteRepository = async (projectName: string): Promise<DownloadRepositoryResult> => {
    const projectPath = join(ansibleReposPath, projectName);
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
      const projectDestinationPath = join(ansibleReposPath, projectName);

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
    const repositoryPath = join(ansibleReposPath, projectName);
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
      const fullPath = join(ansibleReposPath, pathInProject);
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
}
