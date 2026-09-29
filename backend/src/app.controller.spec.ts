import { describe, it, expect, vi } from 'vitest';
import { EntityManager } from '@mikro-orm/postgresql';

import { AppController } from './app.controller';

describe('AppController', () => {
  it('should return the database health status', async () => {
    const execute = vi.fn().mockResolvedValue([{ postgis_version: '3.6.0' }]);

    const em = {
      getConnection: () => ({
        execute,
      }),
    } as unknown as EntityManager;

    const controller = new AppController(em);

    const result = await controller.getHealth();

    expect(result).toEqual({
      status: 'ok',
      database: 'connected',
      postgis: '3.6.0',
    });

    expect(execute).toHaveBeenCalledWith(
      'SELECT PostGIS_Version() AS postgis_version',
    );
  });
});
