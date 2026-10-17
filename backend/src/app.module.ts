import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import mikroOrmConfig from '../mikro-orm.config';

import { AppController } from './app.controller';
import { PoisModule } from './pois/pois.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MikroOrmModule.forRoot(mikroOrmConfig),

    PoisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
