import { Test, TestingModule } from '@nestjs/testing';
import { CommandRunnerService } from './command-runner.service';
import { CommandRunnerRepository } from './command-runner.repository';
import { CommandExecution } from './entities/command-execution.entity';
import { exec } from 'child_process';
import { RunCommandOutput } from './types';

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('CommandRunnerService', () => {
  let service: CommandRunnerService;
  let repository: CommandRunnerRepository;

  beforeEach(async () => {
    const mockCommandRunnerRepository = {
      save: jest.fn(),
      getCommandExecutionsForProject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommandRunnerService,
        {
          provide: CommandRunnerRepository,
          useValue: mockCommandRunnerRepository,
        },
      ],
    }).compile();

    service = module.get<CommandRunnerService>(CommandRunnerService);
    repository = module.get<CommandRunnerRepository>(CommandRunnerRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runCommand', () => {
    it('should execute a command and save the result to the repository', async () => {
      const command = 'test-command';
      const projectName = 'test-project';
      const alias = 'test-alias';
      const expectedResult: RunCommandOutput = {
        success: true,
        output: 'Command executed successfully',
      };

      (exec as unknown as jest.Mock).mockImplementation((_, callback) =>
        callback(null, expectedResult.output, ''),
      );
      jest
        .spyOn(repository, 'save')
        .mockImplementation((commandExecution) => Promise.resolve(commandExecution));

      const result = await service.runCommand(command, projectName, alias);

      expect(result).toEqual(expectedResult);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('getCommandExecutionsForProject', () => {
    it('should fetch command executions for a project from the repository', async () => {
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
        .spyOn(repository, 'getCommandExecutionsForProject')
        .mockImplementation(() => Promise.resolve(expectedResult));

      const result = await service.getCommandExecutionsForProject(projectName);

      expect(result).toEqual(expectedResult);
      expect(repository.getCommandExecutionsForProject).toHaveBeenCalledWith(projectName);
    });
  });
});
