import { Server } from '@overnightjs/core';
import { Application, json } from 'express';

import BeachController from '@src/controllers/BeachController';
import ForecastController from '@src/controllers/ForecastController';
import UserController from '@src/controllers/UserController';
import config from '@src/util/config';
import * as database from '@src/util/database';
import logger from '@src/util/logger';

import HomeController from './controllers/HomeController';

class SetupServer extends Server {
  public constructor(private port: number = config.get('App.port')) {
    super();
  }

  public async init(): Promise<void> {
    this.middlewares();
    this.setupControllers();
    await this.setupDatabase();
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`[OK] Server listening on port: ${this.port}`);
    });
  }

  public async close(): Promise<void> {
    await database.close();
  }

  public getApp(): Application {
    return this.app;
  }

  private middlewares(): void {
    this.app.use(json());
  }

  private setupControllers(): void {
    this.addControllers([
      new HomeController(),
      new ForecastController(),
      new BeachController(),
      new UserController(),
    ]);
  }

  private async setupDatabase(): Promise<void> {
    await database.connect();
  }
}

export default SetupServer;
