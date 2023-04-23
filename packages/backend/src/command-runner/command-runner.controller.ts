import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { CommandRunnerService } from './command-runner.service';
import { RunCommandDto } from '../dto';
import { CommandExecution, RunCommandOutput } from '../types';

@Controller()
export class CommandRunnerController {
  constructor(private readonly commandRunnerService: CommandRunnerService) {}

  @Post('run-command')
  async runCommand(@Body() runCommandDto: RunCommandDto): Promise<RunCommandOutput> {
    return await this.commandRunnerService.runCommand(runCommandDto);
  }

  @Get('/:projectName/command-executions')
  async getCommandExecutionsForProject(
    @Param('projectName') projectName: string,
  ): Promise<CommandExecution[]> {
    return await this.commandRunnerService.getCommandExecutionsForProject(projectName);
  }
}
