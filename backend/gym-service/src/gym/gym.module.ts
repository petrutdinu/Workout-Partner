import { Module } from '@nestjs/common';
import { OverpassService } from './overpass.service';
import { GymService } from './gym.service';
import { GymController } from './gym.controller';

@Module({
  providers: [OverpassService, GymService],
  controllers: [GymController],
})
export class GymModule {}
