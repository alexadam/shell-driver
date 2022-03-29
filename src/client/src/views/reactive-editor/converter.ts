
import MarkdownIt from 'markdown-it'
import Renderer from 'markdown-it/lib/renderer'
import Token from 'markdown-it/lib/token'
import htmlTemplate from './template.html'
import _ from 'underscore'

let stateObj: any = {}
let templatesObj: any = {}
let allVariables: any = []
let codeBlocks: any = []
let filterBlocks: any = []
let selectionActionBlocks: any = []

const generateInputHTML = (data: any) => {
  let htmlInput = ``

  if (data.type !== 'button') {
    stateObj[data.variableName] = data.defaultValue
    allVariables.push(data.variableName)
  }

  const onChangeText = `updateState(this); ${data.onChange + ';'}`

  if (data.type === 'text') {
    htmlInput = `<input id="rd-${data.variableName}" class="rd-text-input rd-input" type="text" oninput="${onChangeText}" value="${data.defaultValue}" />`
  } else if (data.type === 'multiline-text') {
    htmlInput = `<textarea id="rd-${data.variableName}" class="rd-ml-text-input rd-input" type="text" oninput="${onChangeText}">${data.defaultValue}</textarea>`
  } else if (data.type === 'number') {
    htmlInput = `<input id="rd-${data.variableName}" class="rd-text-input rd-input" type="number" oninput="${onChangeText}" value="${data.defaultValue}" />`
  } else if (data.type === 'password') {
    htmlInput = `<input id="rd-${data.variableName}" class="rd-text-input rd-input" type="password" oninput="${onChangeText}" />`
  } else if (data.type === 'list') {
    htmlInput = `<select id="rd-${data.variableName}" class="rd-text-input rd-input" onchange="${onChangeText}" value="${data.defaultValue}" >
      ${data.values.map((v: any) => '<option value="'+v+'" '+(data.defaultValue === v ? 'selected' : '')+'>'+v+'</option>').join('\n')}
    </select>`
  } else if (data.type === 'color') {
    htmlInput = `<input id="rd-${data.variableName}" class="rd-color-input rd-input" type="color" oninput="${onChangeText}" value="${data.defaultValue}" />`
  } else if (data.type === 'date') {
    htmlInput = `<input id="rd-${data.variableName}" class="rd-text-input rd-input" type="date" oninput="${onChangeText}" value="${data.defaultValue}" />`
  } else if (data.type === 'button') {
    htmlInput = `<button id="rd-${data.variableName}" class="rd-button rd-input" onclick="${data.trigger}">${data.label}</button>`
  }  else if (data.type === 'folder') {
    htmlInput = `
    <input id="rd-${data.variableName}" type="text" class="rd-text-input rd-input" value="${data.defaultValue}" oninput="${onChangeText}" />
      <button class='copy-button' onclick="window.top.postMessage({browseFolder: getState('${data.variableName}'), elemId: '${'rd-'+data.variableName}'}, '*')" >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5C4EE9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
      </button>
    `
  }


  /***
   * 
   * 
   <div class="rd-input-block-label">
        ${data.label}
      </div>
   */


  let html = `
    <div class="rd-input-block">
      
      <div class="rd-input-block-row">
        ${htmlInput}  
        <button class="copy-button" onclick="copyInput('rd-${data.variableName}')">
          <svg width="16px" height="16px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100.56 122.88" style="enable-background:new 0 0 100.56 122.88" xml:space="preserve"><g><path d="M72.15,112.2L90.4,93H72.15V112.2L72.15,112.2z M81.75,9.2c0,1.69-1.37,3.05-3.05,3.05c-1.69,0-3.05-1.37-3.05-3.05V6.11 H6.11v92.24h3.01c1.69,0,3.05,1.37,3.05,3.05c0,1.69-1.37,3.05-3.05,3.05H5.48c-1.51,0-2.88-0.61-3.87-1.61l0.01-0.01 c-1-1-1.61-2.37-1.61-3.87V5.48C0,3.97,0.61,2.6,1.61,1.61C2.6,0.61,3.97,0,5.48,0h70.79c1.5,0,2.87,0.62,3.86,1.61l0,0l0.01,0.01 c0.99,0.99,1.61,2.36,1.61,3.86V9.2L81.75,9.2z M100.56,90.55c0,1.4-0.94,2.58-2.22,2.94l-26.88,28.27 c-0.56,0.68-1.41,1.11-2.36,1.11c-0.06,0-0.12,0-0.19-0.01c-0.06,0-0.12,0.01-0.18,0.01H24.29c-1.51,0-2.88-0.61-3.87-1.61 l0.01-0.01l-0.01-0.01c-0.99-0.99-1.61-2.36-1.61-3.86v-93.5c0-1.51,0.62-2.88,1.61-3.87l0.01,0.01c1-0.99,2.37-1.61,3.86-1.61 h70.79c1.5,0,2.87,0.62,3.86,1.61l0,0l0.01,0.01c0.99,0.99,1.61,2.36,1.61,3.86V90.55L100.56,90.55z M94.45,86.9V24.54H24.92v92.24 h41.13V89.95c0-1.69,1.37-3.05,3.05-3.05H94.45L94.45,86.9z"/></g></svg>
        </button>
      </div>
    </div>
    `
  if (data.type === 'button') {
    html = `
    <div class="rd-input-block">
      <div class="rd-input-block-row">
        ${htmlInput}
      </div>
    </div>
    `
  }
  return html
}

const generateTemplateHTML = (data: any, type = '') => {
  const id = `template-${Math.floor(Math.random()*1000000000)}`
  let html = `
  <div class="rd-template">
    <pre id="${id}" class="rd-template-content ${type.length > 0 ? 'rd-' + type : ''}">${data}</pre>
    <div class="rd-template-menu"><button class="copy-button" onclick="copyTemplate('${id}'); this.style.backgroundColor = 'rgba(0,0,0,0.1)'">
      <svg width="16px" height="16px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100.56 122.88" style="enable-background:new 0 0 100.56 122.88" xml:space="preserve"><g><path d="M72.15,112.2L90.4,93H72.15V112.2L72.15,112.2z M81.75,9.2c0,1.69-1.37,3.05-3.05,3.05c-1.69,0-3.05-1.37-3.05-3.05V6.11 H6.11v92.24h3.01c1.69,0,3.05,1.37,3.05,3.05c0,1.69-1.37,3.05-3.05,3.05H5.48c-1.51,0-2.88-0.61-3.87-1.61l0.01-0.01 c-1-1-1.61-2.37-1.61-3.87V5.48C0,3.97,0.61,2.6,1.61,1.61C2.6,0.61,3.97,0,5.48,0h70.79c1.5,0,2.87,0.62,3.86,1.61l0,0l0.01,0.01 c0.99,0.99,1.61,2.36,1.61,3.86V9.2L81.75,9.2z M100.56,90.55c0,1.4-0.94,2.58-2.22,2.94l-26.88,28.27 c-0.56,0.68-1.41,1.11-2.36,1.11c-0.06,0-0.12,0-0.19-0.01c-0.06,0-0.12,0.01-0.18,0.01H24.29c-1.51,0-2.88-0.61-3.87-1.61 l0.01-0.01l-0.01-0.01c-0.99-0.99-1.61-2.36-1.61-3.86v-93.5c0-1.51,0.62-2.88,1.61-3.87l0.01,0.01c1-0.99,2.37-1.61,3.86-1.61 h70.79c1.5,0,2.87,0.62,3.86,1.61l0,0l0.01,0.01c0.99,0.99,1.61,2.36,1.61,3.86V90.55L100.56,90.55z M94.45,86.9V24.54H24.92v92.24 h41.13V89.95c0-1.69,1.37-3.05,3.05-3.05H94.45L94.45,86.9z"/></g></svg>
    </button></div>
  </div>
  `
  templatesObj[id] = data

  return html
}

const generateShellHTML = (data: any, type = '') => {
  const id = `shell-${Math.floor(Math.random()*1000000000)}`
  let html = `
  <div class="rd-template">
    <pre id="${id}" class="rd-shell-content ${type.length > 0 ? 'rd-' + type : ''}">${data}</pre>
    <div class="rd-template-menu">
      <button class="copy-button" onclick="runTemplate('${id}'); this.style.backgroundColor = 'rgba(0,0,0,0.1)'">
        <svg width="16px" height="16px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"  viewBox="0 0 24 24" stroke="#5C4EE9" fill="#5C4EE9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      </button>
      <button class="copy-button" onclick="copyTemplate('${id}'); this.style.backgroundColor = 'rgba(0,0,0,0.1)'">
        <svg width="16px" height="16px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100.56 122.88" style="enable-background:new 0 0 100.56 122.88" xml:space="preserve"><g><path d="M72.15,112.2L90.4,93H72.15V112.2L72.15,112.2z M81.75,9.2c0,1.69-1.37,3.05-3.05,3.05c-1.69,0-3.05-1.37-3.05-3.05V6.11 H6.11v92.24h3.01c1.69,0,3.05,1.37,3.05,3.05c0,1.69-1.37,3.05-3.05,3.05H5.48c-1.51,0-2.88-0.61-3.87-1.61l0.01-0.01 c-1-1-1.61-2.37-1.61-3.87V5.48C0,3.97,0.61,2.6,1.61,1.61C2.6,0.61,3.97,0,5.48,0h70.79c1.5,0,2.87,0.62,3.86,1.61l0,0l0.01,0.01 c0.99,0.99,1.61,2.36,1.61,3.86V9.2L81.75,9.2z M100.56,90.55c0,1.4-0.94,2.58-2.22,2.94l-26.88,28.27 c-0.56,0.68-1.41,1.11-2.36,1.11c-0.06,0-0.12,0-0.19-0.01c-0.06,0-0.12,0.01-0.18,0.01H24.29c-1.51,0-2.88-0.61-3.87-1.61 l0.01-0.01l-0.01-0.01c-0.99-0.99-1.61-2.36-1.61-3.86v-93.5c0-1.51,0.62-2.88,1.61-3.87l0.01,0.01c1-0.99,2.37-1.61,3.86-1.61 h70.79c1.5,0,2.87,0.62,3.86,1.61l0,0l0.01,0.01c0.99,0.99,1.61,2.36,1.61,3.86V90.55L100.56,90.55z M94.45,86.9V24.54H24.92v92.24 h41.13V89.95c0-1.69,1.37-3.05,3.05-3.05H94.45L94.45,86.9z"/></g></svg>
      </button>
    </div>
  </div>
  `
  templatesObj[id] = data

  return html
}

const generateInlineTemplateHTML = (data: any) => {
  const id = `template-${Math.floor(Math.random()*1000000000)}`

  let html = `
  <span class="rd-inline-template">
    <span id="${id}" class="rd-inline-template-content">${data}</span>
  </span>
  `
  templatesObj[id] = data

  return html
}

const createGenericBlock = (content: string, type = '') => {
  return `
  <pre class="rd-generic-block ${type.length > 0 ? 'rd-' + type : ''}">${content}</pre>
  `
}

/////
/////
/////
/////

const RDConvertor = (mdContent: string) => {


stateObj = {}
templatesObj = {}
allVariables = []
codeBlocks = []

  // const md = new MDIT({
  //   html:         true,        // Enable HTML tags in source
  //   xhtmlOut:     false,        // Use '/' to close single tags (<br />).
  //                               // This is only for full CommonMark compatibility.
  //   breaks:       true,        // Convert '\n' in paragraphs into <br>
  //   langPrefix:   'language-',  // CSS language prefix for fenced blocks. Can be
  //                               // useful for external highlighters.
  //   linkify:      true,        // Autoconvert URL-like text to links
  //   typographer:  false,
  // })

  const md = MarkdownIt().set({ html: true, breaks: true, xhtmlOut: false, typographer: false, linkify: true })


  md.renderer.rules.code_inline = (tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    env: any,
    self: Renderer,) => {

    const token = tokens[idx]
    const content = token.content.trim()
    return generateInlineTemplateHTML(content)
  }

  const htmlBlockHandler = (tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    env: any,
    self: Renderer,) => {

      const token = tokens[idx]

      let match = /<([^<\s]+)/gi.exec(token.content)
      const tag = match ? match[1] : ''
      match = /\stype="([^"]+)"/gi.exec(token.content)
      const type = match ? match[1] : ''
      match = /\slabel="([^"]+)"/gi.exec(token.content)
      const label = match ? match[1] : ''
      match = /\svalue="([^"]+)"/gi.exec(token.content)
      const value = match ? match[1] : ''
      match = /\sref="([^"]+)"/gi.exec(token.content)
      const variableName = match ? match[1] : ''
      match = /\sonChange="([^"]+)"/gi.exec(token.content)
      const onchange = match ? match[1] : ''
      
      const data = {
        "type": type,
        "label": label,
        "defaultValue": value,
        "variableName": variableName,
        "onChange": onchange
      }

      if (tag === 'select') {        
        return '' //token.content
      }

      if (tag === 'input') {
        const result = generateInputHTML(data)
        return result
      } else if (['text', 'password', 'number', 'folder'].indexOf(tag) > -1) {
        data['type'] = tag
        const result = generateInputHTML(data)
        return result
      }

      return token.content
  }

  md.renderer.rules.html_inline = htmlBlockHandler
  

  md.renderer.rules.html_block = htmlBlockHandler

  /**
   * 
   * 
<input type="text"
  label="Name"
  defaultValue=""
  variableName="name"
  onChange= "" />
  
<input type="text" value="gigi" ref="text1" onchange="" /> 

<text label="Name" value="" variableName="name" onChange= "" />

<text value="" ref="name" onChange="" />

<select name="cars" id="cars">
  <option value="volvo">Volvo</option>
  <option value="saab">Saab</option>
  <option value="mercedes">Mercedes</option>
  <option value="audi">Audi</option>
</select>

<text value="" ref="name" onChange="" >
</text>

   */


  md.renderer.rules.fence = (tokens: Token[],
    idx: number,
    options: MarkdownIt.Options,
    env: any,
    self: Renderer,) => {
    // a code block
    const token = tokens[idx]
    

    if (token.tag === 'code') {
      const parts = token.info.split(/\s+/)
      let tokenName = token.info
      if (parts.length > 1) {
        tokenName = parts[0]
      }

      if (tokenName === '@input') {
        const content = token.content.trim()
        try {
          const jsonContent = JSON.parse(content)
          const html = generateInputHTML(jsonContent)
          return html
        } catch (error) {
          return content
        }
      } else if (tokenName === '@template') {
        const content = token.content.trim()
        try {
          const html = generateTemplateHTML(content, parts[1])
          return html
        } catch (error) {
          return content
        }
      } else if (tokenName === '@shell') {
        const content = token.content.trim()
        try {
          const html = generateShellHTML(content, parts[1])
          return html
        } catch (error) {
          return content
        }
      } else if (tokenName === '@code') {
        const content = token.content.trim()
        codeBlocks.push(content)
        return ''
      } else if (tokenName === '@filter') {
        const content = token.content.trim()
        filterBlocks.push(content)
        return ''
      } else if (tokenName === '@selection-action') {
        const content = token.content.trim()
        selectionActionBlocks.push(content)
        return ''
      } else {        
        const content = token.content.trim()
        return createGenericBlock(content, tokenName)
      }
    } 

    return token.content
  }


  const html = md.render(mdContent)
  let templateFileContent = htmlTemplate.replace('REPLACE_HTML', html)
  
  const stateStr = `var state = ${JSON.stringify(stateObj)}`
  templateFileContent = templateFileContent.replace('REPLACE_STATE', stateStr)

  const templatesStr = `var templates = ${JSON.stringify(templatesObj)}`
  templateFileContent = templateFileContent.replace('REPLACE_TEMPLATES', templatesStr)

  const codeBlocksStr = codeBlocks.join('\n\n')
  templateFileContent = templateFileContent.replace('REPLACE_CODE', codeBlocksStr)

  const mdLines = mdContent.split('\n')
  const mdHtmlLines = mdLines.map(e => `<!--${_.escape(e)}-->`)
  const mdLinesStr = mdHtmlLines.join('\n')
  templateFileContent = templateFileContent.replace('REPLACE_MD', mdLinesStr)  
  
  return {templateFileContent, allVariables, filterBlocks, selectionActionBlocks}
}

export default RDConvertor