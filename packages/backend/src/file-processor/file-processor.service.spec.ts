import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessorService } from './file-processor.service';
import { existsSync, readdirSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { simpleGit } from 'simple-git';
import { RepositoryActionResult } from '../types';
import { ansibleReposPath, getHostDetails, getProjectDetails, getProjectsHosts } from '../utils';
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  rmSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('simple-git', () => {
  return {
    simpleGit: jest.fn(),
  };
});

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  getHostDetails: jest.fn(),
  getProjectDetails: jest.fn(),
  getProjectsHosts: jest.fn(),
}));

describe('FileProcessorService', () => {
  let service: FileProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileProcessorService],
    }).compile();

    service = module.get<FileProcessorService>(FileProcessorService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call getProjectDetails from utils', async () => {
    const projectName = 'sample-project';
    await service.getProjectDetails(projectName);
    expect(getProjectDetails).toHaveBeenCalledWith(projectName);
  });

  it('should check if a project exists', () => {
    const projectName = 'sample-project';
    const projectPath = join(ansibleReposPath, projectName);
    service.projectExists(projectName);
    expect(existsSync).toHaveBeenCalledWith(projectPath);
  });

  it('should get project playbooks', async () => {
    const projectName = 'sample-project';
    const projectPath = join(ansibleReposPath, projectName);
    const playbookNames = ['playbook1.yml', 'playbook2.yml'];
    (readdirSync as jest.Mock).mockReturnValue(playbookNames);
    await service.getProjectPlaybooks(projectName);
    expect(readdirSync).toHaveBeenCalledWith(projectPath);
    playbookNames.forEach((playbookName: string) => {
      const fullPath = join(projectPath, playbookName);
      expect(readFileSync).toHaveBeenCalledWith(fullPath, 'utf-8');
    });
  });

  it('should call getHostDetails from utils', async () => {
    const projectName = 'sample-project';
    const hostname = 'sample-host';
    await service.getHostDetails(projectName, hostname);
    expect(getHostDetails).toHaveBeenCalledWith(projectName, hostname);
  });

  it('should call getProjectsHosts from utils', async () => {
    await service.getProjectsHosts();
    expect(getProjectsHosts).toHaveBeenCalled();
  });

  it('should deleteRepository', async () => {
    const projectName = 'sample-project';
    const projectPath = join(ansibleReposPath, projectName);
    (existsSync as jest.Mock).mockReturnValue(true);
    const expectedResult: RepositoryActionResult = { success: true };
    const result = await service.deleteRepository(projectName);
    expect(existsSync).toHaveBeenCalledWith(projectPath);
    expect(rmSync).toHaveBeenCalledWith(projectPath, { recursive: true, force: true });
    expect(result).toEqual(expectedResult);
  });

  it('should downloadRepository', async () => {
    const gitRepositoryUrl = 'https://bitbucket.org/scm/sample-project/ansible-weblogic.git.git';
    const projectName = 'sample-project';
    const projectDestinationPath = join(ansibleReposPath, projectName);
    (existsSync as jest.Mock).mockReturnValue(false);
    const gitMock = { clone: jest.fn().mockResolvedValue(undefined) };
    (simpleGit as jest.Mock).mockReturnValue(gitMock);
    const expectedResult: RepositoryActionResult = { success: true };
    const result = await service.downloadRepository(gitRepositoryUrl);
    expect(existsSync).toHaveBeenCalledWith(projectDestinationPath);
    expect(gitMock.clone).toHaveBeenCalledWith(gitRepositoryUrl, projectDestinationPath);
    expect(result).toEqual(expectedResult);
  });

  it('should get the main branch name of a project', async () => {
    const projectName = 'sample-project';
    const projectPath = join(ansibleReposPath, projectName);
    (existsSync as jest.Mock).mockReturnValue(true);
    const gitMock = { revparse: jest.fn().mockResolvedValue('main') };
    (simpleGit as jest.Mock).mockReturnValue(gitMock);
    const { projectExists, mainBranchName } = await service.getMainBranchName(projectName);
    expect(existsSync).toHaveBeenCalledWith(projectPath);
    expect(simpleGit).toHaveBeenCalledWith(projectPath);
    expect(gitMock.revparse).toHaveBeenCalledWith(['--abbrev-ref', 'HEAD']);
    expect(projectExists).toBe(true);
    expect(mainBranchName).toBe('main');
  });

  it('should commit changes', async () => {
    const commitDto = {
      commitMessage: 'Test commit',
      commitBranchName: 'test-branch',
      projectName: 'sample-project',
      updatedVars: [
        {
          pathInProject: 'path/in/project',
          values: 'updated values',
        },
      ],
    };

    const repositoryPath = join(ansibleReposPath, commitDto.projectName);
    const gitMock = {
      getRemotes: jest.fn((_, callback) =>
        callback(null, [
          { refs: { fetch: 'https://bitbucket.org/scm/sample-project/ansible-weblogic.git' } },
        ]),
      ),
      checkoutBranch: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      push: jest.fn().mockResolvedValue({
        remoteMessages: {
          all: [null, 'https://bitbucket.org/scm/sample-project/ansible-weblogic/pull/1'],
        },
      }),
      checkout: jest.fn().mockReturnThis(),
      deleteLocalBranch: jest.fn().mockResolvedValue(undefined),
      revparse: jest.fn().mockResolvedValue('main'),
    };

    (simpleGit as jest.Mock).mockReturnValue(gitMock);

    const result = await service.commit(commitDto);
    expect(simpleGit).toHaveBeenCalledWith(repositoryPath);
    expect(gitMock.checkoutBranch).toHaveBeenCalledWith(commitDto.commitBranchName, 'main');
    expect(gitMock.add).toHaveBeenCalledTimes(commitDto.updatedVars.length);
    expect(gitMock.commit).toHaveBeenCalledWith(commitDto.commitMessage);
    expect(gitMock.push).toHaveBeenCalled();
    expect(gitMock.checkout).toHaveBeenCalledWith('main');
    expect(gitMock.deleteLocalBranch).toHaveBeenCalledWith(commitDto.commitBranchName, true);
    expect(result).toEqual({
      error: false,
      pullRequestUrl: 'https://bitbucket.org/scm/sample-project/ansible-weblogic/pull/1',
    });
  });
});
