import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';

@Injectable()
export class CommandRunnerService {
  async runCommand(command: string): Promise<string> {
    console.log('Command to run: ', command);
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }
}
