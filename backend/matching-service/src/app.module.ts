import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { MatchingModule } from './matching/matching.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';
import { PartnerConnection } from './matching/partner-connection.entity';
import { DirectMessage } from './chat/direct-message.entity';
import { Notification } from './notification/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      database: process.env.DATABASE_NAME || 'workoutpartner',
      username: process.env.DATABASE_USER || 'workoutpartner',
      password: process.env.DATABASE_PASSWORD || 'workoutpartner_password',
      entities: [PartnerConnection, DirectMessage, Notification],
      synchronize: true,
    }),
    HttpModule,
    MatchingModule,
    ChatModule,
    NotificationModule,
  ],
})
export class AppModule {}
