import {Body, Controller, Get, Param, Post} from '@nestjs/common';
import {
  CommitResponse,
  DownloadRepositoryResult,
  FileProcessorService,
} from './file-processor.service';

@Controller()
export class FileProcessorController {
  constructor(private fileProcessorService: FileProcessorService) {}

  @Get('/:projectName/git')
  async getMainBranchName(@Param('projectName') projectName: string) {
    return await this.fileProcessorService.getMainBranchName(projectName);
  }

  @Get('/:projectName/details')
  async getProjectDetails(@Param('projectName') projectName: string) {
    return await this.fileProcessorService.getProjectDetails(projectName);
  }

  @Get('/:projectName/:hostname')
  async getHostDetails(@Param('projectName') projectName: string, @Param('hostname') hostname: string) {
    return await this.fileProcessorService.getHostDetails(projectName, hostname);
  }
  @Get('projects')
  getProjectsHosts() {
    return this.fileProcessorService.getProjectsHosts();
  }
  @Post('commit')
  async commit(@Body() commitDto): Promise<CommitResponse> {
    return await this.fileProcessorService.commit(commitDto);
  }
  @Post('downloadRepository')
  async downloadRepository(
    @Body('gitRepositoryUrl') gitRepositoryUrl,
  ): Promise<DownloadRepositoryResult> {
    return await this.fileProcessorService.downloadRepository(gitRepositoryUrl);
  }

  @Post('deleteRepository')
  async deleteRepository(@Body('projectName') projectName): Promise<DownloadRepositoryResult> {
    return await this.fileProcessorService.deleteRepository(projectName);
  }
}
