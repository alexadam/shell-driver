import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export class FileBrowserController {

  public list(req: Request, res: Response, next: NextFunction): void {

    const result: any = {
      absolutePath: '',
      fileList: []
    }

    let rootPath = req.body.rootPath;
    if (!rootPath) {
      res.json(result)
      return
    }

    if (rootPath === '~') {
      rootPath = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
    }
    
    rootPath = path.resolve(rootPath)

    try {
      const files = fs.readdirSync(rootPath, { withFileTypes: true })

      for (const f of files) {
        result.fileList.push({
          name: f.name,
          isFolder: f.isDirectory()
        })
      }
    } catch (error) {
      console.log(error);
    }

    result.absolutePath = rootPath
    res.json(result)
  }
}