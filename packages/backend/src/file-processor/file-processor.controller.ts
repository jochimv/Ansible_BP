import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
  @Post('commit')
  commit(@Body() commitDto) {
    return this.fileProcessorService.commit(commitDto);
  }

  /*@Get('/:projectName')
  getProjectDetails(@Param('projectName') projectName) {
    return this.fileProcessorService.getProjectDetails(projectName);
  }*/
}
