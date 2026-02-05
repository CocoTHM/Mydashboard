import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExpensesModule } from './expenses/expenses.module';
import { TasksModule } from './tasks/tasks.module';
import { RoadmapsModule } from './roadmaps/roadmaps.module';
import { ToolsModule } from './tools/tools.module';
import { GithubModule } from './github/github.module';
import { VmModule } from './vm/vm.module';
import { EncryptionModule } from './encryption/encryption.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Scheduling (pour les tâches cron)
    ScheduleModule.forRoot(),
    
    // Redis & Bull Queue
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    
    // Modules
    DatabaseModule,
    EncryptionModule,
    AuthModule,
    UsersModule,
    ExpensesModule,
    TasksModule,
    RoadmapsModule,
    ToolsModule,
    GithubModule,
    VmModule,
  ],
})
export class AppModule {}
