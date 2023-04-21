import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommandExecution } from './entities/command-execution.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CommandRunnerRepository {
  constructor(
    @InjectRepository(CommandExecution)
    private readonly repository: Repository<CommandExecution>,
  ) {}

  async find(): Promise<CommandExecution[]> {
    return await this.repository.find();
  }
  async save(commandExecution): Promise<CommandExecution[]> {
    return await this.repository.save(commandExecution);
  }
}
