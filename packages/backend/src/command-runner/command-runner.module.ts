import { Module } from '@nestjs/common';
import { CommandRunnerController } from './command-runner.controller';
import { CommandRunnerService } from './command-runner.service';

@Module({
  controllers: [CommandRunnerController],
  providers: [CommandRunnerService]
})
export class CommandRunnerModule {}
