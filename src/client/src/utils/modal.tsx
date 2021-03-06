import React from "react"
import ReactDOM from "react-dom"
import useKeyDown from "./keydown-listener.hook"

interface IModalProps {
  isVisible: boolean
  onClose: (result: any) => void
  children?: any
  closeOnEsc?: boolean
}

const Modal = (props: IModalProps) => {

  if (!props.isVisible) {
    return null
  }

  /// Close Edit Menu on ESC
  useKeyDown((key: any) => {
    if (key.keyCode === 27 && props.closeOnEsc) {
      props.onClose(null)
    } 
  })

  const onModalBGClick = () => {
    props.onClose(null)
  }

  return (
    ReactDOM.createPortal(<div className="modal" 
    onClick={onModalBGClick} 
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      zIndex: 98,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)'
    }}>
      <div className="modal-content" 
        onClick={(e)=> e.stopPropagation()} 
        style={{zIndex: 99, 
        maxHeight: '100%',
        maxWidth: '100%',
        }}>
        {props.children}
      </div>
    </div> , document.body)
  )
}
export default Modal