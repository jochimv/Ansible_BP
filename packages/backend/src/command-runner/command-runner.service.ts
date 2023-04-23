import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { CommandExecution } from './entities/command-execution.entity';
import { CommandRunnerRepository } from './command-runner.repository';
import { RunCommandOutput } from './types';

@Injectable()
export class CommandRunnerService {
  constructor(private commandExecutionRepository: CommandRunnerRepository) {}

  async runCommand(command: string, projectName: string, alias: string): Promise<RunCommandOutput> {
    return new Promise((resolve) => {
      exec(
        `cd ansible_repos && cd ${projectName} && ${command}`,
        async (error, stdout: string, stderr: string) => {
          let output: string;
          let isError: boolean;
          if (error) {
            // Check if there is any content in stdout
            output = stdout.trim() ? stdout : stderr;
            isError = true;
          } else {
            output = stdout;
            isError = false;
          }
          const isSuccess = !isError;
          const commandExecution = new CommandExecution();
          commandExecution.alias = alias;
          commandExecution.output = output;
          commandExecution.success = isSuccess;
          commandExecution.command = command;
          commandExecution.projectName = projectName;
          commandExecution.executionDate = new Date();
          await this.commandExecutionRepository.save(commandExecution);
          resolve({ output: output, success: isSuccess });
        },
      );
    });
  }

  async getCommandExecutionsForProject(projectName: string): Promise<CommandExecution[]> {
    return await this.commandExecutionRepository.getCommandExecutionsForProject(projectName);
  }
}
