// src/command-runner/command-runner.controller.ts
import { Controller, Post, Body, Get } from '@nestjs/common';
import { CommandRunnerService, RunCommandOutput } from './command-runner.service';
import { CommandExecution } from './entities/command-execution.entity';

@Controller()
export class CommandRunnerController {
  constructor(private readonly commandRunnerService: CommandRunnerService) {}

  @Post('run-command')
  async runCommand(
    @Body('command') command: string,
    @Body('projectName') projectName: string,
    @Body('alias') alias: string,
  ): Promise<RunCommandOutput> {
    return await this.commandRunnerService.runCommand(command, projectName, alias);
  }

  @Get('command-executions')
  async getCommandExecutions(): Promise<CommandExecution[]> {
    return await this.commandRunnerService.getCommandExecutions();
  }
}
