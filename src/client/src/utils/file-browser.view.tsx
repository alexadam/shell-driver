import React, { useEffect } from "react";
import { useState } from "react";
import ReactDOM from "react-dom";
import './file-browser.view.scss'
import Modal from "./modal";


interface IFileObj {
  name: string
  isFolder: boolean
}

interface IListing {
  absolutePath: string
  fileList: IFileObj[]
}

interface IFileBrowserViewProps {
  isVisible: boolean
  onClose: () => void
  onSelectFile: (path: string) => void
  rootFolder?: string
  selectType?: string // folder | file | any
}

const FileBrowserView = (props: IFileBrowserViewProps) => {
  const [rootPath, setRootPath] = useState(props.rootFolder ? props.rootFolder : '~');
  const [fileList, setFileList] = useState<IFileObj[]>([]);
  const [selectIndex, setSelectIndex] = useState<any>(null);

  const getList = async (path: string) => {
    if (!path || path.length === 0) {
      return
    }

    const res = await fetch('http://localhost:23000/browse/', {
      method: 'POST', 
      headers: {"Content-type": "application/json; charset=UTF-8"},
      body: JSON.stringify({ rootPath: path })
    })
    const data: IListing = await res.json() 

    setRootPath(data.absolutePath)
    setFileList(data.fileList as IFileObj[])

    // axios.post(`http://localhost:3000/browse`, { rootPath: path })
    //   .then((response: any) => {
    //     console.log(response);
    //     const data = response.data as IListing
    //     setRootPath(data.absolutePath)
    //     setFileList(data.fileList as IFileObj[])
    //   })
    //   .catch(function (error) {
    //     console.log(error);
    //   });
  }

  useEffect(() => {
    if (props.isVisible) {
      getList(props.rootFolder!)
    }
  }, [props.isVisible]);


  const onViewClose = () => {
    props.onClose()
  }

  const onUpDir = () => {
    getList(rootPath + '/..')
  }

  const goTo = (name: string) => {
    getList(rootPath + `/${name}`)
  }

  const onSelect = () => {    
    if (selectIndex === null) {
      props.onSelectFile(rootPath)
      return
    }
    const fullPath = `${rootPath}/${fileList[selectIndex].name}`
    props.onSelectFile(fullPath)
  }

  let filesComponents = fileList.map((f: IFileObj, index) => {
    if (!f.isFolder) {
      return <div key={index}
        onClick={() => setSelectIndex((i: any) => i === index ? null : index)}
        className={selectIndex === index ? 'file-row selected' : 'file-row'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V9l-7-7z" /><path d="M13 3v6h6" /></svg>
        {f.name}</div>
    }
    return <div key={index}
      onDoubleClick={() => goTo(f.name)}
      onClick={() => setSelectIndex((i: any) => i === index ? null : index)}
      className={selectIndex === index ? 'file-row selected' : 'file-row'}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="yellow" stroke="#000000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
      <b>{f.name}</b></div>
  })

  if (props.selectType === 'folder') {    
    filesComponents = fileList.map((f: IFileObj, index) => {
      if (!f.isFolder) {        
        return <div key={index} className={'file-row file-not-selectable'}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V9l-7-7z" /><path d="M13 3v6h6" /></svg>
          {f.name}</div>
      }
      return <div key={index}
        onDoubleClick={() => goTo(f.name)}
        onClick={() => setSelectIndex((i: any) => i === index ? null : index)}
        className={selectIndex === index ? 'file-row selected' : 'file-row selectable'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="yellow" stroke="#000000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        <b>{f.name}</b></div>
    })
  } else if (props.selectType === 'file') {    
    filesComponents = fileList.map((f: IFileObj, index) => {
      if (!f.isFolder) {
        return <div key={index}
          onClick={() => setSelectIndex((i: any) => i === index ? null : index)}
          className={selectIndex === index ? 'file-row selected' : 'file-row'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V9l-7-7z" /><path d="M13 3v6h6" /></svg>
          {f.name}</div>
      }
      return <div key={index} className={'file-row file-not-selectable'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="yellow" stroke="#000000" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
        <b>{f.name}</b></div>
    })
  }


  return (
    ReactDOM.createPortal(
      <Modal isVisible={props.isVisible} onClose={onViewClose}>
        <div className="file-list-modal-content">
          <div className="title">Select A Folder:</div>
          <div className="files-list">
            <button onDoubleClick={onUpDir}
              onClick={onUpDir} className="up-dir-button"
            ><b>..</b></button>
            {filesComponents}
          </div>
          <div className="file-list-footer">
            <button className="normal" onClick={props.onClose}>Cancel</button>
            <button className="run-button" onClick={onSelect}>Select</button>
          </div>
        </div>
      </Modal>
      , document.body)
  )
}
export default FileBrowserView