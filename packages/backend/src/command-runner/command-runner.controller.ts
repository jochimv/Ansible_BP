// src/command-runner/command-runner.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { CommandRunnerService } from './command-runner.service';

@Controller()
export class CommandRunnerController {
  constructor(private readonly commandRunnerService: CommandRunnerService) {}

  @Post('run-command')
  async runCommand(@Body('command') command: string) {
    return await this.commandRunnerService.runCommand(command);
  }
}
