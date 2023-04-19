import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';

export interface RunCommandOutput {
  error: boolean;
  output: string;
}
@Injectable()
export class CommandRunnerService {
  async runCommand(command: string, projectName: string): Promise<RunCommandOutput> {
    return new Promise((resolve) => {
      exec(
        `cd ansible_repos && cd ${projectName} && ${command}`,
        (error, stdout: string, stderr: string) => {
          if (error) {
            // Check if there is any content in stdout
            const output = stdout.trim() ? stdout : stderr;
            resolve({ output: output, error: true });
          } else {
            resolve({ output: stdout, error: false });
          }
        },
      );
    });
  }
}
