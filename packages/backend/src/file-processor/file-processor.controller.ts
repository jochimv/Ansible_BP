import { Controller, Get, Param } from '@nestjs/common';
import { FileProcessorService } from './file-processor.service';

@Controller()
export class FileProcessorController {
  constructor(private fileProcessorService: FileProcessorService) {}
  @Get('/:projectName/:hostName')
  getHostDetails(@Param('projectName') projectName, @Param('hostName') hostName: string) {
    return this.fileProcessorService.getHostDetails(projectName, hostName);
  }
  @Get('projects')
  getProjectsHosts() {
    return this.fileProcessorService.getProjectsHosts();
  }
}
