/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommandExecution } from './entities/command-execution.entity';
import { Repository } from 'typeorm';
import { CommandExecution as ICommandExecution } from '../types';
@Injectable()
export class CommandRunnerRepository {
  constructor(
    @InjectRepository(CommandExecution)
    private readonly repository: Repository<CommandExecution>,
  ) {}

  async save(commandExecution): Promise<ICommandExecution[]> {
    return await this.repository.save(commandExecution);
  }

  async getCommandExecutionsForProject(projectName: string): Promise<ICommandExecution[]> {
    return await this.repository
      .createQueryBuilder('command_execution')
      .where('command_execution."projectName" = :projectName', { projectName })
      .orderBy('command_execution."executionDate"', 'DESC')
      .getMany();
  }
}
