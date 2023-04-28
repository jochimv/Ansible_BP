/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { Module } from '@nestjs/common';
import { FileProcessorController } from './file-processor.controller';
import { FileProcessorService } from './file-processor.service';

@Module({
  controllers: [FileProcessorController],
  providers: [FileProcessorService],
})
export class FileProcessorModule {}
