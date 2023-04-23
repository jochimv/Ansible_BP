import { Test, TestingModule } from '@nestjs/testing';
import { CommandRunnerRepository } from './command-runner.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommandExecution } from './entities/command-execution.entity';

describe('CommandRunnerRepository', () => {
  let commandRunnerRepository: CommandRunnerRepository;
  let mockRepository;

  beforeEach(async () => {
    const queryBuilderMock = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    mockRepository = {
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => queryBuilderMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommandRunnerRepository,
        {
          provide: getRepositoryToken(CommandExecution),
          useValue: mockRepository,
        },
      ],
    }).compile();

    commandRunnerRepository = module.get<CommandRunnerRepository>(CommandRunnerRepository);
  });

  it('should be defined', () => {
    expect(commandRunnerRepository).toBeDefined();
  });

  it('should save the commandExecution and return it', async () => {
    const commandExecution = new CommandExecution();
    commandExecution.projectName = 'sample-project';
    commandExecution.success = true;
    commandExecution.alias = 'alias';
    commandExecution.command = 'command';
    commandExecution.output = 'output';

    mockRepository.save.mockResolvedValue(commandExecution);

    const result = await commandRunnerRepository.save(commandExecution);
    expect(result).toEqual(commandExecution);
    expect(mockRepository.save).toHaveBeenCalledWith(commandExecution);
  });

  it('should get command executions for the given project name', async () => {
    const projectName = 'sample-project';
    const commandExecution1 = new CommandExecution();
    commandExecution1.projectName = projectName;
    commandExecution1.success = true;
    commandExecution1.alias = 'alias1';
    commandExecution1.command = 'command1';
    commandExecution1.output = 'output1';

    const commandExecution2 = new CommandExecution();
    commandExecution2.projectName = projectName;
    commandExecution2.success = true;
    commandExecution2.alias = 'alias2';
    commandExecution2.command = 'command2';
    commandExecution2.output = 'output2';

    mockRepository
      .createQueryBuilder()
      .getMany.mockResolvedValue([commandExecution1, commandExecution2]);

    const result = await commandRunnerRepository.getCommandExecutionsForProject(projectName);
    expect(result).toEqual([commandExecution1, commandExecution2]);
    expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('command_execution');
  });
});
