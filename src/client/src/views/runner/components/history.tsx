
import React, { useEffect, useState } from "react"
import Modal from "../../../utils/modal"
import './history.scss'

interface ICmdHistoryProps {
  historyData: string[]
  isInfoVisible: boolean
  onInfoClose: () => void
}

const CmdHistory = (props: ICmdHistoryProps) => {

  const [dataModel, setDataModel] = useState(props.historyData)

  useEffect(() => {
    setDataModel(props.historyData)
  }, [props.historyData])

  const saveAsMDScript = () => {

    const tasks = []

    let index = 1
    for (const t of dataModel) {
      tasks.push(`\`\`\`@shell
${t}
\`\`\`
`)
    }

    const mdScript = `# Script

${tasks.join('\n')}
  
`

    const link = document.createElement('a');
    const textFileAsBlob = new Blob([mdScript], { type: 'text/plain;charset=utf-8' });
    link.setAttribute('href', window.URL.createObjectURL(textFileAsBlob));
    link.setAttribute('download', 'new-script.md');
    link.click();

    props.onInfoClose()
  }


  return (
    <Modal isVisible={props.isInfoVisible} onClose={props.onInfoClose}>
      <div className="cmd-history-dialog">

        <div className="cmd-history-container">
          <div className="cmd-history-title">History</div>

          {
            dataModel.map((d: any, i: number) => <div className="hist-cmd" key={i}>
              {d}
            </div>)
          }

        </div>

        <div className="cmd-history-dialog-footer">
          <div className="action-button" onClick={props.onInfoClose}>Close</div>
          <div className="action-button" onClick={saveAsMDScript}>Save as MD Script</div>
        </div>
      </div>
    </Modal>
  )
}

export default CmdHistory