import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FileProcessorService } from './file-processor.service';
import {
  CommitResponse,
  HostDetailsResponse,
  ProjectDetailsAndPlaybooks,
  ProjectDetailsResponse,
  ProjectHosts,
  ProjectPlaybook,
  RepositoryActionResult,
} from '../types';

@Controller()
export class FileProcessorController {
  constructor(private fileProcessorService: FileProcessorService) {}

  @Get('/:projectName/exists')
  async projectExists(@Param('projectName') projectName: string): Promise<boolean> {
    return this.fileProcessorService.projectExists(projectName);
  }

  @Get('/:projectName/details-playbooks')
  async getProjectDetailsAndPlaybooks(
    @Param('projectName') projectName: string,
  ): Promise<ProjectDetailsAndPlaybooks> {
    const { projectExists, projectDetails } = await this.fileProcessorService.getProjectDetails(
      projectName,
    );
    if (!projectExists) {
      return { projectExists, projectDetails: null, projectPlaybooks: null };
    }
    const projectPlaybooks: ProjectPlaybook[] = await this.fileProcessorService.getProjectPlaybooks(
      projectName,
    );
    return { projectDetails, projectPlaybooks, projectExists };
  }

  @Get('/:projectName/main-branch-name')
  async getMainBranchName(@Param('projectName') projectName: string) {
    return await this.fileProcessorService.getMainBranchName(projectName);
  }

  @Get('/:projectName/details')
  async getProjectDetails(
    @Param('projectName') projectName: string,
  ): Promise<ProjectDetailsResponse> {
    return await this.fileProcessorService.getProjectDetails(projectName);
  }

  @Get('/:projectName/host/:hostname')
  async getHostDetails(
    @Param('projectName') projectName: string,
    @Param('hostname') hostname: string,
  ): Promise<HostDetailsResponse> {
    return await this.fileProcessorService.getHostDetails(projectName, hostname);
  }
  @Get('projects-hosts')
  async getProjectsHosts(): Promise<ProjectHosts[]> {
    console.log('ansible repos path: ', process.env.ANSIBLE_REPOS_PATH);
    return await this.fileProcessorService.getProjectsHosts();
  }
  @Post('commit')
  async commit(@Body() commitDto): Promise<CommitResponse> {
    return await this.fileProcessorService.commit(commitDto);
  }
  @Post('download-repository')
  async downloadRepository(
    @Body('gitRepositoryUrl') gitRepositoryUrl,
  ): Promise<RepositoryActionResult> {
    return await this.fileProcessorService.downloadRepository(gitRepositoryUrl);
  }

  @Post('delete-repository')
  async deleteRepository(@Body('projectName') projectName): Promise<RepositoryActionResult> {
    return await this.fileProcessorService.deleteRepository(projectName);
  }
}
