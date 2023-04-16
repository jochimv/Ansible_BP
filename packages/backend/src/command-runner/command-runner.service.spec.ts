import { Test, TestingModule } from '@nestjs/testing';
import { CommandRunnerService } from './command-runner.service';

describe('CommandRunnerService', () => {
  let service: CommandRunnerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommandRunnerService],
    }).compile();

    service = module.get<CommandRunnerService>(CommandRunnerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
