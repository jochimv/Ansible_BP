/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessorController } from './file-processor.controller';
import { FileProcessorService } from './file-processor.service';
import { CommitResponse, RepositoryActionResult } from '../types';

jest.mock('./file-processor.service');

describe('FileProcessorController', () => {
  let controller: FileProcessorController;
  let service: FileProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileProcessorController],
      providers: [
        {
          provide: FileProcessorService,
          useValue: {
            projectExists: jest.fn(),
            getProjectDetails: jest.fn(),
            getProjectPlaybooks: jest.fn(),
            getMainBranchName: jest.fn(),
            getHostDetails: jest.fn(),
            getProjectsHosts: jest.fn(),
            commit: jest.fn(),
            downloadRepository: jest.fn(),
            deleteRepository: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FileProcessorController>(FileProcessorController);
    service = module.get<FileProcessorService>(FileProcessorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call projectExists', async () => {
    const projectName = 'sample-project';
    // @ts-ignore
    jest.spyOn(service, 'projectExists').mockResolvedValueOnce(true);
    const result = controller.projectExists(projectName);
    expect(result).toBeTruthy();
    expect(service.projectExists).toHaveBeenCalledWith(projectName);
  });

  it('should call getProjectDetailsAndPlaybooks', async () => {
    const projectName = 'sample-project';
    const projectExists = true;
    const projectDetails = { name: projectName };
    const projectPlaybooks = [{ playbookName: 'playbook1', content: 'content1' }];

    jest
      .spyOn(service, 'getProjectDetails')
      // @ts-ignore
      .mockResolvedValueOnce({ projectExists, projectDetails });
    jest.spyOn(service, 'getProjectPlaybooks').mockResolvedValueOnce(projectPlaybooks);

    const result = await controller.getProjectDetailsAndPlaybooks(projectName);
    expect(result).toEqual({ projectExists, projectDetails, projectPlaybooks });
    expect(service.getProjectDetails).toHaveBeenCalledWith(projectName);
    expect(service.getProjectPlaybooks).toHaveBeenCalledWith(projectName);
  });

  it('should call getMainBranchName', async () => {
    const projectName = 'sample-project';
    const mainBranchName = 'main';

    jest
      .spyOn(service, 'getMainBranchName')
      .mockResolvedValueOnce({ projectExists: true, mainBranchName });

    const result = await controller.getMainBranchName(projectName);
    expect(result).toEqual({ projectExists: true, mainBranchName });
    expect(service.getMainBranchName).toHaveBeenCalledWith(projectName);
  });

  it('should call getProjectDetails', async () => {
    const projectName = 'sample-project';
    const projectExists = true;
    const projectDetails = { name: projectName };

    jest
      .spyOn(service, 'getProjectDetails')
      // @ts-ignore
      .mockResolvedValueOnce({ projectExists, projectDetails });

    const result = await controller.getProjectDetails(projectName);
    expect(result).toEqual({ projectExists, projectDetails });
    expect(service.getProjectDetails).toHaveBeenCalledWith(projectName);
  });

  it('should call getHostDetails', async () => {
    const projectName = 'sample-project';
    const hostname = 'host1';
    const hostDetails = { hostname, otherData: 'data' };

    // @ts-ignore
    jest.spyOn(service, 'getHostDetails').mockResolvedValueOnce(hostDetails);

    const result = await controller.getHostDetails(projectName, hostname);
    expect(result).toEqual(hostDetails);
    expect(service.getHostDetails).toHaveBeenCalledWith(projectName, hostname);
  });

  it('should call getProjectsHosts', async () => {
    const projectsHosts = [
      { projectName: 'project1', hosts: ['host1', 'host2'] },
      { projectName: 'project2', hosts: ['host3', 'host4'] },
    ];

    // @ts-ignore
    jest.spyOn(service, 'getProjectsHosts').mockResolvedValueOnce(projectsHosts);

    const result = await controller.getProjectsHosts();
    expect(result).toEqual(projectsHosts);
    expect(service.getProjectsHosts).toHaveBeenCalled();
  });

  it('should call commit', async () => {
    const commitDto = {
      commitMessage: 'Sample message',
      commitBranchName: 'feature/sample',
      projectName: 'sample-project',
      updatedVars: [{ pathInProject: 'path/to/file', values: 'updated data' }],
    };
    const commitResponse: CommitResponse = {
      error: false,
      pullRequestUrl: 'http://example.com/pr',
    };

    jest.spyOn(service, 'commit').mockResolvedValueOnce(commitResponse);

    const result = await controller.commit(commitDto);
    expect(result).toEqual(commitResponse);
    expect(service.commit).toHaveBeenCalledWith(commitDto);
  });

  it('should call downloadRepository', async () => {
    const gitRepositoryUrl = 'https://github.com/sample/sample-project.git';
    const downloadRepositoryResult: RepositoryActionResult = { success: true };

    jest.spyOn(service, 'downloadRepository').mockResolvedValueOnce(downloadRepositoryResult);

    const result = await controller.downloadRepository(gitRepositoryUrl);
    expect(result).toEqual(downloadRepositoryResult);
    expect(service.downloadRepository).toHaveBeenCalledWith(gitRepositoryUrl);
  });

  it('should call deleteRepository', async () => {
    const projectName = 'sample-project';
    const downloadRepositoryResult: RepositoryActionResult = { success: true };
    jest.spyOn(service, 'deleteRepository').mockResolvedValueOnce(downloadRepositoryResult);

    const result = await controller.deleteRepository({ projectName });
    expect(result).toEqual(downloadRepositoryResult);
    expect(service.deleteRepository).toHaveBeenCalledWith({ projectName });
  });
});
