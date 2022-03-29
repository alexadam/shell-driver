import express from 'express';
import { FileBrowserController } from './file-browser.controller';

export class FileBrowserRoutes {

    private readonly _router = express.Router();
    private controller = new FileBrowserController();

    constructor() {
        this.routesSetup()
    }

    get router(): express.Router {
        return this._router;
      }

    private routesSetup() {
        this._router.post("/browse", this.controller.list);
    }
}