import React, { useEffect, useRef, useState } from "react"
import { Terminal, ITerminalOptions, ITerminalAddon, ILinkProvider } from 'xterm'
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import nunjucks from 'nunjucks'
// import 'node_modules/xterm/css/xterm.css"'
import 'xterm/css/xterm.css'
import './shell.view.scss'
import CmdHistory from "./components/history";
import RDConvertor from "../reactive-editor/converter";
import FileBrowserView from "../../utils/file-browser.view";
import { useNavigate } from "react-router-dom";
import _ from "underscore";
import ReactiveEditorView from "../reactive-editor/reactive-editor.view";
import Modal from "../../utils/modal";


////
////
////
////
////
////
////

const RunShellView = () => {
  
  const filtersRef = useRef<any[]>([])
  const [selectionActionsData, setSelectionActionsData] = useState<string[]>([])
  const selectionActionsTemplatesRef = useRef<string[]>([])
  const stateVarsRef = useRef<{[index: string]: string}>({})
  const [searchString, setSearchString] = useState('')
  const [runnerURL, setRunnerURL] = useState('ws://localhost:3004')
  const [isHistoryVisible, setIsHistoryVisible] = useState(false)
  const [isMultilineInput, setIsMultilineInput] = useState(false)
  const termElemRef = useRef<any>(null)
  const termRef = useRef<Terminal | null>(null)
  const uploadFileButtonRef = useRef<any>(null)
  const termSelTectRef = useRef('')
  const [termSelText, setTermSelText] = useState('')
  const [isConnectedToRemoteRunner, setIsConnectedToRemoteRunner] = useState(false)
  const [cmdInput, setCmdInput] = useState('')
  const searchAddonRef = useRef<any>(null)
  const historyRef = useRef<string[]>([])
  const logRef = useRef<string>('')
  const htmlPreviewIframeRef = useRef<any>(null)
  const [isCustomFileBrowserVisible, setIsCustomFileBrowserVisible] = useState(false)
  const [rootPath, setRootPath] = useState('')
  const [isInEditMode, setIsInEditMode] = useState(false)
  const targetElemId = useRef<any>(null)
  const mdScript = useRef('')
  const navigate = useNavigate();

  ////
  ////
  ////

  const ws = useRef<WebSocket | null>(null);

  ///
  ///
  ///
  ///

  const __run = (data: string) => {

    let tmpData = data.trim()

    if (tmpData === 'Ctrl + D') {
      tmpData = '\x04'
    } else if (tmpData === 'Ctrl + C') {
      tmpData = '\x03'
    }

    historyRef.current.push(tmpData)

    ws.current?.send(JSON.stringify({
      run: tmpData + '\n',
      shellId: 1234
    }))
  }

  const disconnectRunner = () => {
    setIsConnectedToRemoteRunner(false)
    ws.current?.close()
    termRef.current?.reset()
  }


  const connectToRunner = () => {
    if (ws.current) {
      ws.current.close()
      termRef.current?.reset()
    }

    if (!runnerURL) {
      return
    }

    ws.current = new WebSocket(runnerURL)

    ws.current.onmessage = (message) => {
      const str = message.data
      const dataJson = JSON.parse(str)

      if (dataJson.stdout) {
        logRef.current += dataJson.stdout
        termRef.current?.write(dataJson.stdout)
      }
    };

    ////
    ////
    ////

    setTimeout(() => {
      ws.current?.send(JSON.stringify({
        newShell: true,
        shellId: 1234 // TODO !!! 
      }))

      setIsConnectedToRemoteRunner(true)

    }, 500);

  }

  useEffect(() => {

    window.onmessage = (e: any) => {
      if (e.data.run) {
        __run(e.data.run)
      } else if (e.data.newState) {
        stateVarsRef.current = {...e.data.newState, '$selection': termSelTectRef.current || ''}
        refreshTemplates()
      } else if (e.data.browseFolder) {        
        targetElemId.current = e.data.elemId
        setRootPath(e.data.browseFolder)
        setIsCustomFileBrowserVisible(true)
      }
    };

     ///
    //  if (htmlPreviewIframeRef.current) {
    //   htmlPreviewIframeRef.current.srcdoc = `<html>
    //   <head>
    //   <script>
    //     function emit(message) {
    //       window.top.postMessage(message, '*')
    //     }
    //   </script>
    //   </head>
    //   <body>
    //   <button onclick="emit('bibi')">click</button>
    //   </body></html>`
    // }

    // https://xtermjs.org/docs/
    termRef.current = new Terminal({
      rendererType: 'dom',
      scrollback: 99999999,
      convertEol: true,
      // screenReaderMode: true,
      // theme: 
    });

    const fitAddon = new FitAddon();
    termRef.current.loadAddon(fitAddon);

    const searchAddon = new SearchAddon();
    termRef.current.loadAddon(searchAddon);
    searchAddonRef.current = searchAddon
    // https://github.com/xtermjs/xterm.js/tree/master/addons/xterm-addon-search


    if (termElemRef.current) {
      termRef.current.open(termElemRef.current);
    }

    fitAddon.fit();

    termRef.current.onSelectionChange((s: any, u: any) => {
      // termSelTectRef.current = termRef.current!.getSelection()
      const sel = termRef.current!.getSelection()
      if (sel.length > 0) {
        termSelTectRef.current = sel
        setTermSelText(sel)
      }
    })
    // termRef.current.onTitleChange((s: any, u: any) => console.log('TITLE', s, u))

    /////
    /////
    /////
    nunjucks.configure({ autoescape: false });


    //
    //
    //
    //clean up function
    const wsCurrent = ws.current
    return () => wsCurrent?.close();

  }, [])

  useEffect(() => {

    stateVarsRef.current = {...stateVarsRef.current , '$selection': termSelTectRef.current || ''}
    refreshTemplates()

  }, [termSelText])


  useEffect(() => {
    if (!isInEditMode) {
      const { templateFileContent, allVariables, filterBlocks, selectionActionBlocks } = RDConvertor(mdScript.current)
      htmlPreviewIframeRef.current.srcdoc = mdScript.current.length === 0 ? '' : templateFileContent
      filtersRef.current = filterBlocks
      selectionActionsTemplatesRef.current = selectionActionBlocks
      refreshTemplates()
    }
  }, [isInEditMode])


  ////


  const refreshTemplates = () => {
    const newSelActions = []

    for (const t of selectionActionsTemplatesRef.current) {
      const tmp = nunjucks.renderString(t, stateVarsRef.current)
      newSelActions.push(tmp)
    }

    setSelectionActionsData(newSelActions)
  }


  const loadScript = (e: any) => {
    e.preventDefault()
    const reader = new FileReader()
    reader.onload = async (ev: any) => {
      let text = ev.target.result

      if (fileExt === 'html') {
        let lines: string[] = text.split('\n')
        lines = lines.filter(l => l.trim().startsWith('<!--')).map(l => _.unescape(l.replace('<!--', '').replace('-->', '')))
        text = lines.join('\n')
      }

      const {templateFileContent, allVariables, filterBlocks, selectionActionBlocks} = RDConvertor(text)
      htmlPreviewIframeRef.current.srcdoc = templateFileContent
      filtersRef.current = filterBlocks
      selectionActionsTemplatesRef.current = selectionActionBlocks
      mdScript.current = text
      refreshTemplates()
    };
    const file = e.target.files[0]    
    const fileExt = file.name.substr(file.name.lastIndexOf('.') + 1,file.name.length)    
    reader.readAsText(file)
  }

  const onSelectionActionClick = (data: string) => {
    __run(data)
  }

  const onRunnerURLChange = (e: any) => {
    const newValue = e.target.value.trim()
    setRunnerURL(newValue)
  }

  const onRunCmdInput = () => {
    __run(cmdInput)
    setCmdInput('')
  }

  const onCmdInputKeyDown = (e: any) => {
    if (!isMultilineInput && e.keyCode === 13) {
      onRunCmdInput()
    }
  }

  const saveTermLog = () => {
    const link = document.createElement('a');
    const textFileAsBlob = new Blob([logRef.current], { type: 'text/plain;charset=utf-8' });

    link.setAttribute('href', window.URL.createObjectURL(textFileAsBlob));
    link.setAttribute('download', 'logs-' + (new Date()).toString().replace(/\s+/g, '_') + '.txt');
    link.click();
  }

  const showHistory = () => {
    setIsHistoryVisible(true)
  }


  const closeBrowseFolder = () => {
    setIsCustomFileBrowserVisible(false)
  }

  const onSelectFile = (f: string) => {    
    htmlPreviewIframeRef.current.contentWindow.postMessage({updateState: {id: targetElemId.current, value: f}}, '*');
    
    setIsCustomFileBrowserVisible(false)
    targetElemId.current = null
  }

  const editScript = () => {
    setIsInEditMode(true)
  }

  const onSaveEditChanges = (newMdString: string | null) => {
    if (newMdString) {
      mdScript.current = newMdString
    }

    setIsInEditMode(false)
  }

  /////
  /////
  /////
  /////

  let connectToRunnerButton: any = <div className="term-connect-button" onClick={connectToRunner}>Connect To Remote Runner</div>  
  if (isConnectedToRemoteRunner) {
    connectToRunnerButton = null
  }

  let disconnectButton: any = <button className="action-button runner-url-input-button" onClick={disconnectRunner}>Disconnect</button>
  if (!isConnectedToRemoteRunner) {
    disconnectButton = null
  }

  let selectionActions: any = null
  if (selectionActionsData.length > 0) {        
    selectionActions = <>
         { selectionActionsData.map(
              (s: any, i: number) => (
                <div key={i} className="selection-action" onClick={() => onSelectionActionClick(s)} title={s}>
                  {s.slice(0, 30) + (s.length > 30 ? '...' : '')}
                </div>
              )
          )}
    </>

  }

  // if (isInEditMode) {
  //   return (
  //     <ReactiveEditorView mdString={mdScript.current} onClose={onSaveEditChanges} isEmbedded={true} />
  //   )
  // }

  return (
    <div className="shell-view-container">
      <div className="shell-view-header">
        <div className="shell-view-header-left">
          <button onClick={() => uploadFileButtonRef.current?.click()} className="action-button" title="Open MD or HTML script">Load Script</button>
          <input ref={uploadFileButtonRef} type="file" onChange={loadScript} />
          <button onClick={() => navigate('/edit')} className="action-button" title="New script">New</button>
        </div>
        <div className="shell-view-header-right">
          <span className="runner-url-input-label">Runner URL:</span>
          <input type="text" className="runner-url-input" value={runnerURL} onInput={onRunnerURLChange} />
          {disconnectButton}
        </div>
      </div>
      <div className="shell-view-content">
        <div className="shell-view-list-container">
          <iframe className="html-preview-frame" ref={htmlPreviewIframeRef}></iframe>
          <div className="list-menu">
            <button className="term-filter-button" title="Edit Script" onClick={editScript}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C4EE9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon></svg>
            </button>
          </div>
        </div>
        <div className="shell-view-term-container">
          <div className="shell-view-term-header">
            <div className="shell-search">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" className="shell-search-input" value={searchString}
                 onInput={(e:any) => setSearchString(e.target.value)} 
                 onKeyDown={(e: any) => {
                    if (e.keyCode === 13) {
                      searchAddonRef.current.findNext(searchString, {regex: true, caseSensitive: false})
                    }
                 }} />
              <button className="term-filter-button " onClick={() => {
                if (searchAddonRef.current && searchString.length > 0) {
                  searchAddonRef.current.findPrevious(searchString, {regex: true, caseSensitive: false})
                }
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C4EE9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
              </button>
              <button className="term-filter-button " onClick={() => {
                if (searchAddonRef.current && searchString.length > 0) {
                  searchAddonRef.current.findNext(searchString, {regex: true, caseSensitive: false})
                }
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C4EE9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
            </div>
            {
              filtersRef.current.length > 0 ? 
              filtersRef.current.map((f: any, i: number ) => {

                // "name": "Filter1",
                // "regex": "",
                // "ignoreCase": "true"

                  const filterJson = JSON.parse(f)

                  return (
                      <div key={i} className="term-filter">
                        <div className="term-filter-label" title={filterJson.regex}>{filterJson.name}</div>
                        <button className="term-filter-button " onClick={() => {
                          if (searchAddonRef.current) {
                            searchAddonRef.current.findPrevious(filterJson.regex, {regex: true, caseSensitive: false})
                          }
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C4EE9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
                        </button>
                        <button className="term-filter-button " onClick={() => {
                          if (searchAddonRef.current) {
                            searchAddonRef.current.findNext(filterJson.regex, {regex: true, caseSensitive: false})
                          }
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C4EE9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                      </div>
                    )
                  }
                
                )
             
              : null
            }
          </div>
          <div className="shell-view-terminal">
            <div className="xterm-wrapper" ref={termElemRef} ></div>
            { connectToRunnerButton }
          </div>
          <div className="selection-actions-container">
            { selectionActions }
          </div>
          <div className="shell-view-term-footer">
            <button onClick={showHistory} className="shell-view-cmd-input-button" title="History">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C4EE9" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </button>
            <button onClick={() => setIsMultilineInput(e => !e)} className="shell-view-cmd-input-button" title="Multiline Input">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C4EE9" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 9.5H3M21 4.5H3M21 14.5H3M17 19.5H3"/></svg>
            </button>
            {
              !isMultilineInput ? 
                <input className="shell-view-cmd-input" type="text" value={cmdInput} onChange={(e) => setCmdInput(e.target.value)} onKeyDown={onCmdInputKeyDown} />
              :
                <textarea className="shell-view-cmd-input" value={cmdInput} onChange={(e) => setCmdInput(e.target.value)} onKeyDown={onCmdInputKeyDown}></textarea>
            }

            <button className="shell-view-cmd-input-button cmd-action-btn" onClick={onRunCmdInput}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{width: '18px', height: '18px'}} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5C4EE9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 9l-6 6 6 6"/><path d="M20 4v7a4 4 0 0 1-4 4H5"/></svg>
            </button>
            <button className="shell-view-cmd-input-button action-button action-button-small" onClick={() => __run('\x03')}>Ctrl+C</button>
            <button className="shell-view-cmd-input-button action-button action-button-small" onClick={() => __run('\x04')}>Ctrl+D</button>
            <button onClick={saveTermLog} className="action-button action-button-small" title="Save Logs" style={{width: '30px', paddingTop:'5px'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C4EE9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 17l5-5-5-5M19.8 12H9M13 22a10 10 0 1 1 0-20"/></svg>
            </button>
          </div>
        </div>
      </div>
      <CmdHistory isInfoVisible={isHistoryVisible} onInfoClose={() => setIsHistoryVisible(false)} historyData={historyRef.current} />
      
      <FileBrowserView
        isVisible={isCustomFileBrowserVisible}
        rootFolder={rootPath}
        onClose={closeBrowseFolder}
        onSelectFile={onSelectFile}
        selectType="folder"
      />

      <Modal isVisible={isInEditMode} onClose={onSaveEditChanges} closeOnEsc={false}>
        <div style={{width: `${document.body.clientWidth}px`, height: `${document.body.clientHeight}px`}}>
          <ReactiveEditorView mdString={mdScript.current} onClose={onSaveEditChanges} isEmbedded={true} />
        </div>
      </Modal>
    </div>
  )
}

export default RunShellView