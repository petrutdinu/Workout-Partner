import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PartnerConnection } from './partner-connection.entity';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { PublicProfileService } from './public-profile.service';
import { PublicProfileController } from './public-profile.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [TypeOrmModule.forFeature([PartnerConnection]), HttpModule, NotificationModule],
  providers: [MatchingService, PublicProfileService],
  controllers: [MatchingController, PublicProfileController],
  exports: [MatchingService],
})
export class MatchingModule {}
