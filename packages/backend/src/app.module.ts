import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { FileProcessorModule } from './file-processor/file-processor.module';
import { ConfigModule } from '@nestjs/config';
import { CommandRunnerModule } from './command-runner/command-runner.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.STAGE}`],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    FileProcessorModule,
    CommandRunnerModule,
  ],
  // controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
