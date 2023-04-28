/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CommandRunnerController } from './command-runner.controller';
import { CommandRunnerService } from './command-runner.service';
import { CommandExecution } from './entities/command-execution.entity';
import { CommandRunnerRepository } from './command-runner.repository';
import { RunCommandOutput } from '../types';
import { RunCommandDto } from '../dto';

describe('CommandRunnerController', () => {
  let controller: CommandRunnerController;
  let service: CommandRunnerService;

  beforeEach(async () => {
    const mockCommandRunnerRepository = {
      save: jest.fn(),
      getCommandExecutionsForProject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommandRunnerController],
      providers: [
        CommandRunnerService,
        {
          provide: CommandRunnerRepository,
          useValue: mockCommandRunnerRepository,
        },
      ],
    }).compile();

    controller = module.get<CommandRunnerController>(CommandRunnerController);
    service = module.get<CommandRunnerService>(CommandRunnerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call runCommand from CommandRunnerService with the provided params', async () => {
    const runCommandDto: RunCommandDto = {
      commandId: 1,
      command: 'test-command',
      projectName: 'test-project',
      alias: 'test-alias',
    };

    const expectedResult: RunCommandOutput = {
      success: true,
      output: 'Command executed successfully',
    };

    jest.spyOn(service, 'runCommand').mockImplementation(() => Promise.resolve(expectedResult));

    const result = await controller.runCommand(runCommandDto);

    expect(result).toEqual(expectedResult);
    expect(service.runCommand).toHaveBeenCalledWith(runCommandDto);
  });

  it('should call getCommandExecutionsForProject from CommandRunnerService with the provided projectName', async () => {
    const projectName = 'test-project';
    const expectedResult: CommandExecution[] = [
      {
        id: 1,
        alias: 'test-alias',
        command: 'test-command',
        projectName: 'test-project',
        output: 'Command executed successfully',
        success: true,
        executionDate: new Date(),
      },
    ];

    jest
      .spyOn(service, 'getCommandExecutionsForProject')
      .mockImplementation(() => Promise.resolve(expectedResult));

    const result = await controller.getCommandExecutionsForProject(projectName);

    expect(result).toEqual(expectedResult);
    expect(service.getCommandExecutionsForProject).toHaveBeenCalledWith(projectName);
  });
});
