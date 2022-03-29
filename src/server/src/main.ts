import cors from 'cors';
import express, { Application, NextFunction, Request, Response } from 'express';
import AppError, { HttpStatusCode } from './custom-error';
import pino from 'pino'

import { PtyRunnerRoutes } from './modules/pty-runner/pty-runner.routes';
import { FileBrowserRoutes } from './modules/file-browser/file-browser.routes';

export const Logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      levelFirst: true,
      translateTime: "yyyy-mm-dd, h:MM:ss TT",
    }
  }
});

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//
// 
// Setup routes

app.use('/', express.static('client-dist'))
app.use('/edit', express.static('client-dist'))

const routes = [
  new PtyRunnerRoutes(),
  new FileBrowserRoutes(),
]

routes.forEach(item => app.use('/', item.router))

//
// 
// return error for all routes that are not matched 

app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl}`, HttpStatusCode.NOT_FOUND))
});

// 
// 
// Error Handling Middleware

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500

  if (err instanceof AppError) {
    statusCode = err.statusCode
  }

  Logger.error(err.message)

  res.status(statusCode).json({
    type: 'error',
    message: err.message
  });
});


const server = app.listen(23000, '0.0.0.0');

// for tests
export default server