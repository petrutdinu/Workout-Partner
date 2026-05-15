import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      database: process.env.DATABASE_NAME || 'workoutpartner',
      username: process.env.DATABASE_USER || 'workoutpartner',
      password: process.env.DATABASE_PASSWORD || 'workoutpartner_password',
      entities: [User],
      synchronize: false,
    }),
    UserModule,
  ],
})
export class AppModule {}
