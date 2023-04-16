import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { FileProcessorModule } from './file-processor/file-processor.module';
import { ConfigModule } from '@nestjs/config';
import { CommandRunnerModule } from './command-runner/command-runner.module';

@Module({
  imports: [
    FileProcessorModule,
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.STAGE}`],
    }),
    CommandRunnerModule,
  ],
  // controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
