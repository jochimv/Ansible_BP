import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { FileProcessorModule } from './file-processor/file-processor.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    FileProcessorModule,
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.STAGE}`],
    }),
  ],
  // controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
