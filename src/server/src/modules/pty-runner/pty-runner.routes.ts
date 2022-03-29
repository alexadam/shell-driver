import express from 'express';
import { PtyRunnerController } from './pty-runner.controller';

export class PtyRunnerRoutes {

  private readonly _router = express.Router();
  private controller = new PtyRunnerController();

  constructor() {
    this.routesSetup()
  }

  get router(): express.Router {
    return this._router
  }

  private routesSetup() {
    // this._router.get("/getShellDataById/:id", this.controller.getShellDataById)
  }
}