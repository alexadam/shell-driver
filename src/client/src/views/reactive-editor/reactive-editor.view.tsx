

import React, { useEffect, useRef, useState } from "react"
import './reactive-editor.view.scss'

import { Controlled as CodeMirror } from 'react-codemirror2'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/markdown/markdown'

import Popup from "../../utils/popup"
import RDConvertor from "./converter"
import _ from "underscore"

interface IReactiveEditorViewProps {
  isEmbedded?: boolean
  mdString?: string
  onClose?: (newMdString: string | null) => void
}

////
////

const ReactiveEditorView = (props: IReactiveEditorViewProps) => {

  const editorRef = useRef<any>(null)
  const [isInputPopupVisible, setIsInputPopupVisible] = useState(false)
  const addVarRefParentBBOX = useRef<any>(null)
  const insertFromPopupPosRef = useRef<any>(null)
  const lastEditorFocusRef = useRef<any>(null)
  const htmlPreviewIframeRef = useRef<any>(null)
  const uploadFileButtonRef = useRef<any>(null)
  const isInsideTaskCmd = useRef<boolean>(false)
  const isInsideTasks = useRef<boolean>(false)
  const isInsideParameters = useRef<boolean>(false)
  const isInsideSelectionActions = useRef<boolean>(false)
  const isInsideFilters = useRef<boolean>(false)
  const varsRef = useRef<string[]>([])
  const htmlContentRef = useRef<string>()
  const [textValue, setTextValue] = useState( props.mdString !== undefined ? props.mdString :`# Hello

**Your Name**

<text value="" ref="name" />

\`\`\`@shell
echo Hello {{ name }}
\`\`\`

`)

  useEffect(() => {
    // const jsonData = parseMd(textValue, sections)

    const tmpObj = RDConvertor(textValue)
    const html = tmpObj.templateFileContent
    htmlContentRef.current = html
    // setHtmlContent(html)

    varsRef.current = []
    for (const param of tmpObj.allVariables) {
      varsRef.current.push('{{ ' + param + ' }}')
    }
    varsRef.current.push(`{{ $selection }}`)
  }, [])

  useEffect(() => {
    const tmpObj: any = RDConvertor(textValue)    
    const html = tmpObj.templateFileContent
    htmlContentRef.current = html
    ///
    ///
    varsRef.current = []
    for (const param of tmpObj.allVariables) {
      varsRef.current.push('{{ ' + param + ' }}')
    }
    varsRef.current.push(`{{ $selection }}`)
    
    if (htmlPreviewIframeRef.current) {
      htmlPreviewIframeRef.current.srcdoc = html
    }
  }, [textValue])
  
  const onInsert = (type: string) => {

    setIsInputPopupVisible(false)

    const cursor = editorRef.current.getCursor()
    const index = editorRef.current.indexFromPos(cursor)

    let tmpText = ''

    if (type === 'template') {
      tmpText = `\`\`\`@template

\`\`\``
    } else if (type === 'code') {
      tmpText =  `\`\`\`@code

\`\`\``
    } else if (type === 'shell') {
      tmpText =  `\`\`\`@shell

\`\`\``
    } else if (type === 'text') {
      tmpText = `<text value="" ref="text1" />` 
    } else if (type === 'password') {
      tmpText = `<password value="" ref="pass1" />`
    } else if (type === 'number') {
      tmpText = `<number value="42" ref="n1" />`
    } else if (type === 'folder') {
    tmpText = `<folder value="/home/" ref="folder1" />`
    } else if (type === 'filter') {
      tmpText = `\`\`\`@filter
{
  "name": "Filter1",
  "regex": "",
  "ignoreCase": "true"
}
\`\`\``
    } else if (type === 'selection-action') {
      tmpText = `\`\`\`@selection-action
{{ $selection }}
\`\`\``
    } else if (type === 'Ctrl + C') {
      tmpText = `Ctrl + C`
    } else if (type === 'Ctrl + D') {
      tmpText = `Ctrl + D`
    } else {
      tmpText = type
    }

    if (insertFromPopupPosRef.current) {      
      editorRef.current.replaceRange('', {line: insertFromPopupPosRef.current.line, ch: insertFromPopupPosRef.current.ch - 1}, insertFromPopupPosRef.current)
      insertFromPopupPosRef.current = null
    }

    editorRef.current.replaceSelection(tmpText);

    setTimeout(() => {
      setTextValue(editorRef.current.getValue())
    }, 300);

    editorRef.current.focus({ preventScroll: true })

  }

  const loadScript = (e: any) => {
    e.preventDefault()
    const reader = new FileReader()
    reader.onload = async (ev: any) => {
      const text = (ev.target.result)

      if (fileExt === 'html') {
        let lines: string[] = text.split('\n')
        lines = lines.filter(l => l.trim().startsWith('<!--')).map(l => _.unescape(l.replace('<!--', '').replace('-->', '')))
        console.log(lines.join('\n'))
        setTextValue(lines.join('\n'))
      } else {
        setTextValue(text)
      }
    };
    const file = e.target.files[0]    
    const fileExt = file.name.substr(file.name.lastIndexOf('.') + 1,file.name.length)    
    reader.readAsText(file)
  }

  const getDocTitle = () => {
    let lines: string[] = textValue.split('\n')
    for (const line of lines) {
      if (line.trim().startsWith('# ')) {
        return line.trim().replace('# ', '')
      }
    }
    return 'document'
  }

  const onSaveFile = () => {
    const link = document.createElement('a');
    const textFileAsBlob = new Blob([textValue], { type: 'text/plain;charset=utf-8' });

    link.setAttribute('href', window.URL.createObjectURL(textFileAsBlob));
    link.setAttribute('download', getDocTitle().replace(/\s+/g, '_') + '.md');
    link.click();
  }

  const onSaveFileAsHtml = () => {
    const link = document.createElement('a');
    const textFileAsBlob = new Blob([htmlContentRef.current || ''], { type: 'text/plain;charset=utf-8' });

    link.setAttribute('href', window.URL.createObjectURL(textFileAsBlob));
    link.setAttribute('download', getDocTitle().replace(/\s+/g, '_') + '.html');
    link.click();
  }

  const getContext = (atLine: number) => {
    const lines = editorRef.current.getValue().split('\n')
    let i = atLine - 1
    let nrOfBlocks = 0
    isInsideTaskCmd.current = false
    isInsideParameters.current = false
    isInsideTasks.current = false
    isInsideSelectionActions.current = false
    isInsideFilters.current = false

    while (i > -1) {
      const line = lines[i].trim()
      if (lines[i].trim() === '```') {
        nrOfBlocks++
      }
      if (lines[i].trim() === '```@shell' && nrOfBlocks === 0) {
        isInsideTaskCmd.current = true
        return
      }
      i--
    }
  }
  

  const refsList = varsRef.current.map((v, i )=> <button className="text-button popup-button" key={i}
      onKeyUp={(e: any) => e.keyCode === 40 ? e.target.nextElementSibling?.focus() : e.keyCode === 38 ? e.target.previousElementSibling?.focus() : null}
      onClick={() => onInsert(v)}>{v}</button>)

  let insertPopupContent: any = null
  if (isInsideTaskCmd.current) {
    insertPopupContent = (
      <div className="insert-popup-column">
        <button className="text-button popup-button" 
          onKeyUp={(e: any) => e.keyCode === 40 ? e.target.nextElementSibling?.focus() : e.keyCode === 38 ? e.target.previousElementSibling?.focus() : null}
          onClick={() => onInsert('Ctrl + C')}>Ctrl + C</button>
        <button className="text-button popup-button" 
          onKeyUp={(e: any) => e.keyCode === 40 ? e.target.nextElementSibling?.focus() : e.keyCode === 38 ? e.target.previousElementSibling?.focus() : null}
          onClick={() => onInsert('Ctrl + D')}>Ctrl + D</button>
        {refsList}
      </div>
    )
  } else  {
    insertPopupContent = (
      <div className="insert-popup-column">
        <button className="text-button popup-button" tabIndex={0} 
          onKeyUp={(e: any) => e.keyCode === 40 ? e.target.nextElementSibling?.focus() : e.keyCode === 38 ? e.target.previousElementSibling?.focus() : null}
          onClick={() => onInsert('text')}>Text Input</button>
        <button className="text-button popup-button" tabIndex={1} 
          onKeyUp={(e: any) => e.keyCode === 40 ? e.target.nextElementSibling?.focus() : e.keyCode === 38 ? e.target.previousElementSibling?.focus() : null}
          onClick={() => onInsert('password')}>Password Input</button>
        <button className="text-button popup-button" 
          onKeyUp={(e: any) => e.keyCode === 40 ? e.target.nextElementSibling?.focus() : e.keyCode === 38 ? e.target.previousElementSibling?.focus() : null}
          onClick={() => onInsert('number')}>Number Input</button>
        <button className="text-button popup-button" 
          onKeyUp={(e: any) => e.keyCode === 40 ? e.target.nextElementSibling?.focus() : e.keyCode === 38 ? e.target.previousElementSibling?.focus() : null}
          onClick={() => onInsert('folder')}>Folder Input</button>
        <button className="text-button popup-button" 
          onKeyUp={(e: any) => e.keyCode === 40 ? e.target.nextElementSibling?.focus() : e.keyCode === 38 ? e.target.previousElementSibling?.focus() : null}
          onClick={() => onInsert('shell')}>Shell</button>
        <button className="text-button popup-button"
          onKeyUp={(e: any) => e.keyCode === 40 ? e.target.nextElementSibling?.focus() : e.keyCode === 38 ? e.target.previousElementSibling?.focus() : null}
          onClick={() => onInsert('selection-action')}>Selection Action</button>
        <button className="text-button popup-button" 
          onKeyUp={(e: any) => e.keyCode === 40 ? e.target.nextElementSibling?.focus() : e.keyCode === 38 ? e.target.previousElementSibling?.focus() : null}
          onClick={() => onInsert('filter')}>Filter</button>
      </div>
    )
  } 

  let bottomMenu = null
  if (props.isEmbedded && props.onClose) {
    bottomMenu = (
      <div className="md-editor-top-menu" style={{justifyContent: 'center', padding: '10px 0px'}}>
        <button onClick={() => props.onClose!(null)} className="action-button" style={{backgroundColor: 'red'}}>Cancel</button>
        <button onClick={() => props.onClose!(textValue)} className="action-button" style={{backgroundColor: 'green'}}>Save Changes</button>
      </div>
    )
  }

  return (
    <div className="md-editor-view">
      <div className="md-editor-top-menu">
        <button onClick={() => uploadFileButtonRef.current?.click()} className="text-button">Load Script</button>
        <input ref={uploadFileButtonRef} type="file" onChange={loadScript} />
        <button onClick={onSaveFile} className="text-button">Save as MD</button>
        <button onClick={onSaveFileAsHtml} className="text-button">Save as HTML</button>
      </div>
      <div className="md-editor-container">
        <div className="md-editor-menu">
          <div className="md-editor-menu-group">
            <button className='action-button' onClick={() => onInsert('text')}>Text Input</button>
            <button className='action-button' onClick={() => onInsert('password')}>Password Input</button>
            <button className='action-button' onClick={() => onInsert('number')}>Number Input</button>
            <button className='action-button' onClick={() => onInsert('folder')}>Folder Input</button>
          </div>
          <div className="md-editor-menu-group">
            <button className='action-button' onClick={() => onInsert('shell')}>Shell Cmd</button>
            <button className='text-button' onClick={() => onInsert('Ctrl+D')}>Ctrl+D</button>
            <button className='text-button' onClick={() => onInsert('Ctrl+C')}>Ctrl+C</button>
          </div>

          <div className="md-editor-menu-group">
            <button className='action-button' onClick={() => onInsert('selection-action')}>Selection Action</button>
          </div>

          <div className="md-editor-menu-group">
            <button className='action-button' onClick={() => onInsert('filter')}>Filter</button>
          </div>

          <div className="md-editor-menu-group">
            <span style={{fontFamily: 'sans-serif', fontSize: '12px'}}>Or press "\" in the Editor</span>
          </div>
        </div>
        <div className="md-editor">
          <CodeMirror
            className="code"
            editorDidMount={editor => { editorRef.current = editor }}
            value={textValue}
            options={{
              mode: 'markdown',
              // theme: 'material',
              lineNumbers: false,
              lineWrapping: true,
            }}
            onBeforeChange={(editor, data, value) => {
              setTextValue(value)
            }}
            onKeyDown={(editor, event) => {              
              if (event.keyCode === 40) {
                lastEditorFocusRef.current = editor.getCursor() 
                const els = document.getElementsByClassName('popup-button')
                const el = els[0] as HTMLElement;
                if (el) {
                  event.preventDefault()
                  event.stopPropagation()
                  el.focus()
                }
              } else {
                setIsInputPopupVisible(false)
              }
            }}
            onKeyUp={(editor, event) => {
              if (event.key === '\\') {
                insertFromPopupPosRef.current = editor.getCursor()
                getContext(editor.getCursor().line)
                addVarRefParentBBOX.current = editor.cursorCoords(true)
                setIsInputPopupVisible(true) 
              } else if (event.keyCode === 8) {
                setIsInputPopupVisible(false)
              }
            }}
            onChange={(editor, data, value) => {
              const char = data.text
            }}
            onMouseDown={(editor, event) => {
            }}
          />
        </div>
        <div className="md-editor" style={{marginLeft: '20px'}}>
          <iframe className="html-preview-frame" ref={htmlPreviewIframeRef}></iframe>
        </div>
      </div>

      { bottomMenu }

      <Popup isVisible={isInputPopupVisible}
        onClose={() => setIsInputPopupVisible(false)}
        parentBBOX={addVarRefParentBBOX.current}
        minWidth={250}
      >
        {insertPopupContent}
      </Popup>
    </div>

  )
}

export default ReactiveEditorView