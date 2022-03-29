import * as nodePty from "node-pty";
import os from 'os'


const wait = (time = 1000) => {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('');
    }, time);
  })
  return promise
}

/////
/////
/////

class NodePTYShell {
  private clientId: string
  private shellId: string
  private rawOutput: any[] = []
  private history: string[] = []
  private tmpBuffer: string[] = []
  private outputHandler: ((clientId: string, shellId: string, stdout: any) => void) | null  = null

  private _shellProcess: any = null
  private shellStr = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

  // TODO - params
  // cols , rows, xterm/color , cwd

  constructor(clientId = '', shellId = '', shellType = 'xterm', cols = 80, rows = 30) {
    this.clientId = clientId
    this.shellId = shellId

    this._shellProcess = nodePty.spawn(this.shellStr, [], {
      name: shellType,
      cols,
      rows,
      cwd: process.env.HOME,
      env: process.env as any // TODO !!!! error
    });
    
    this._shellProcess.onData( (data: any) => {

      this.rawOutput.push(data)

      if (this.outputHandler) {
        this.outputHandler(this.clientId, this.shellId, data)
      }

    });
  }

  

  onOutput(handler: (clientId: string, shellId: string, stdout: any) => void): void {
    this.outputHandler = handler
  }

  onExit(handler: any): void {
  }

  write(command: string): void {
    this.history.push(command)
    this._shellProcess.write(command + '\n')
  }

  rawWrite(command: string): void {
    this.history.push(command)
    this._shellProcess.write(command)
  }

  async sleep(timeoutInMillis: number): Promise<any> {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('');
      }, timeoutInMillis);
    })
    return promise
  }

  getHistory(): string[] {
    return this.history
  }

  getRawOutput(): any[] {
    return this.rawOutput
  }

  CtrlD(): void {
    this._shellProcess.write('\x04')
  }

  CtrlC(): void {
    this._shellProcess.write('\x03')
  }

  exit(): void {
    this._shellProcess.kill()
  }

}

export default NodePTYShell