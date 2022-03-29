import { NextFunction, Request, Response } from 'express';
import { WebSocket } from 'ws';
import NodePTYShell from '../../lib/node-pty-shell';

interface IClient {
  id: string
  ws: any
  shells: {[index: string]: NodePTYShell}
}

export class PtyRunnerController {

  wsServer: any = null
  clients: { [index: string]: IClient } = {}

  constructor() {
    this.wsServer = new WebSocket.Server({
      port: 3004
    })
    

    this.wsServer.on('connection', (ws: any) => {
      const id = `client-${Math.floor(Math.random() * 1000000000)}`
      const metadata = { id }      

      const client = {
        id,
        ws,
        shells: {}
      }

      this.clients[id] = client

      ////
      ////

      ws.on('message', (message: any) => {
        const jsonData = JSON.parse(message)
        const shellId = jsonData.shellId

        if (jsonData.newShell) {
          /**
           * {
           *    newShell: true,
           *    shellId: 1234
           * }
           */
        
          const nodePtyShell: NodePTYShell = new NodePTYShell(id, shellId, 'xterm-color', 80, 30)

          nodePtyShell.onOutput((clientId: string, shellId: string, stdout: any) => {            
            this.clients[clientId]?.ws.send(JSON.stringify({ stdout, shellId }))
          })

          this.clients[id].shells[shellId] = nodePtyShell
        } else if (jsonData.run) {
           /**
           * {
           *    run: command,
           *    shellId: 1234
           * }
           */

          const shell = this.clients[id].shells[shellId]

          if (shell) {
            shell.rawWrite(jsonData.run)
          }
        }
      })

      ws.on("close", () => {
        delete this.clients[ws]
      });

    })

  }

}