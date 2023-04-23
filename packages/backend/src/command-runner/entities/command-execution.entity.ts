import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { CommandExecution as ICommandExecution } from '../../types';

@Entity()
export class CommandExecution implements ICommandExecution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectName: string;

  @Column()
  success: boolean;

  @Column()
  alias: string;

  @Column()
  command: string;

  @Column()
  output: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  executionDate: Date;
}
