/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { CommandExecution } from './entities/command-execution.entity';
import { CommandRunnerRepository } from './command-runner.repository';
import { RunCommandDto } from '../dto';
import { RunCommandOutput, CommandExecution as ICommandExecution } from '../types';

@Injectable()
export class CommandRunnerService {
  constructor(private commandExecutionRepository: CommandRunnerRepository) {}

  async runCommand(runCommandDto: RunCommandDto): Promise<RunCommandOutput> {
    const { projectName, command, alias }: RunCommandDto = runCommandDto;
    let enhancedCommand = command;
    if (command.startsWith('ansible-playbook')) {
      const commandParts = command.split(' ');
      const iIndex = commandParts.findIndex(part => part === '-i');
      if (iIndex >= 0 && iIndex + 1 < commandParts.length) {
        commandParts[iIndex + 1] = `${process.env.ANSIBLE_REPOS_PATH}/${commandParts[iIndex + 1]}`;
        enhancedCommand = commandParts.join(' ');
      }
    }
    return new Promise((resolve) => {
      exec(`cd ansible_repos && cd ${projectName} && ${enhancedCommand}`, async (error, stdout: string, stderr: string) => {
        let output: string;
        let isError: boolean;
        if (error) {
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
      });
    });
  }

  async getCommandExecutionsForProject(projectName: string): Promise<ICommandExecution[]> {
    return await this.commandExecutionRepository.getCommandExecutionsForProject(projectName);
  }
}
