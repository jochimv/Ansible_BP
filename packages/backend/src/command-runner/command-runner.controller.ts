/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 * Description: This file defines the CommandRunnerController, which handles incoming HTTP requests
 *              for running commands and fetching command execution history for a specific project.
 *              It contains two main routes: one for running commands (POST /run-command) and another
 *              for retrieving the command execution history for a given project
 *              (GET /:projectName/command-executions).
 */

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
