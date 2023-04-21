import { Module } from '@nestjs/common';
import { CommandRunnerController } from './command-runner.controller';
import { CommandRunnerService } from './command-runner.service';
import { CommandRunnerRepository } from './command-runner.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommandExecution } from './entities/command-execution.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommandExecution])],
  controllers: [CommandRunnerController],
  providers: [CommandRunnerService, CommandRunnerRepository],
})
export class CommandRunnerModule {}
