import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  CommitResponse,
  DownloadRepositoryResult,
  FileProcessorService,
} from './file-processor.service';

@Controller()
export class FileProcessorController {
  constructor(private fileProcessorService: FileProcessorService) {}

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
