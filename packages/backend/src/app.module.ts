import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileProcessorModule } from './file-processor/file-processor.module';

@Module({
  imports: [FileProcessorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
