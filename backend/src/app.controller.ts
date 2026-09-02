import { Controller, Get } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

@Controller()
export class AppController {
  constructor(private readonly em: EntityManager) {}

  @Get('health')
  async getHealth() {
    const result = await this.em
      .getConnection()
      .execute<{ postgis_version: string }[]>(
        'SELECT PostGIS_Version() AS postgis_version',
      );

    return {
      status: 'ok',
      database: 'connected',
      postgis: result[0].postgis_version,
    };
  }
}
