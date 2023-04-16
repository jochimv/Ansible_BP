import { Test, TestingModule } from '@nestjs/testing';
import { CommandRunnerController } from './command-runner.controller';

describe('CommandRunnerController', () => {
  let controller: CommandRunnerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommandRunnerController],
    }).compile();

    controller = module.get<CommandRunnerController>(CommandRunnerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
