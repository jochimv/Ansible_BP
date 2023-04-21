// command-execution.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CommandExecution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  projectName: string;

  @Column()
  alias: string;

  @Column()
  output: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  executionDate: Date;
}
