import { Body, Controller, Get, Post } from '@nestjs/common';
import { CommitResponse, FileProcessorService } from './file-processor.service';

@Controller()
export class FileProcessorController {
  constructor(private fileProcessorService: FileProcessorService) {}
  /*@Get('/:projectName/:hostName')
  getHostDetails(@Param('projectName') projectName, @Param('hostName') hostName: string) {
    return this.fileProcessorService.getHostDetails(projectName, hostName);
  }*/
  @Get('projects')
  getProjectsHosts() {
    return this.fileProcessorService.getProjectsHosts();
  }
  @Post('commit')
  async commit(@Body() commitDto): Promise<CommitResponse> {
    return await this.fileProcessorService.commit(commitDto);
  }

  /*@Get('/:projectName')
  getProjectDetails(@Param('projectName') projectName) {
    return this.fileProcessorService.getProjectDetails(projectName);
  }*/
}
