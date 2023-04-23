import { Test, TestingModule } from '@nestjs/testing';
import { CommandRunnerController } from './command-runner.controller';
import { CommandRunnerService } from './command-runner.service';
import { RunCommandOutput } from './command-runner.service';
import { CommandExecution } from './entities/command-execution.entity';
import { CommandRunnerRepository } from './command-runner.repository';

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

  describe('runCommand', () => {
    it('should call runCommand from CommandRunnerService with the provided params', async () => {
      const command = 'test-command';
      const projectName = 'test-project';
      const alias = 'test-alias';
      const expectedResult: RunCommandOutput = {
        success: true,
        output: 'Command executed successfully',
      };

      jest.spyOn(service, 'runCommand').mockImplementation(() => Promise.resolve(expectedResult));

      const result = await controller.runCommand(command, projectName, alias);

      expect(result).toEqual(expectedResult);
      expect(service.runCommand).toHaveBeenCalledWith(command, projectName, alias);
    });
  });

  describe('getCommandExecutionsForProject', () => {
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
});
