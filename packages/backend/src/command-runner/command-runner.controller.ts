import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CommandRunnerService } from './command-runner.service';
import { CommandExecution } from './entities/command-execution.entity';
import { RunCommandOutput } from './types';

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

  @Get('/:projectName/command-executions')
  async getCommandExecutionsForProject(
    @Param('projectName') projectName: string,
  ): Promise<CommandExecution[]> {
    return await this.commandRunnerService.getCommandExecutionsForProject(projectName);
  }
}
