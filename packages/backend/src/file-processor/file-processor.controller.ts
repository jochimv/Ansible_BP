import { Controller, Get } from '@nestjs/common';
import { FileProcessorService } from './file-processor.service';


@Controller('projects')
export class FileProcessorController {

    constructor(private fileProcessorService: FileProcessorService) {}

    @Get()
    getProjects() {
        return this.fileProcessorService.getProjectsHosts();
    }
}
