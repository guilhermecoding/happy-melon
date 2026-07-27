import { Module } from '@nestjs/common';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { auth } from './auth/auth.js';
import { AdministratorsModule } from './administrators/administrators.module.js';
import { ContestsModule } from './contests/contests.module.js';
import { QuestionsModule } from './questions/questions.module.js';

@Module({
  imports: [
    AuthModule.forRoot({ auth }),
    AdministratorsModule,
    ContestsModule,
    QuestionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
