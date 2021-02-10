import React from 'react';
import Modal from '../Modal';

class FileLoadModal extends React.Component {
  constructor(props) {
    super(props);
    this.file_input = React.createRef();
  }
  render() {
    return (
      <Modal
      title='Load File'
      handleClose={this.props.handleClose}
      content={
        <div className='FileLoadModal flex-center'>
          <div className='content'>
          <form action=''
            onSubmit={e => {e.preventDefault();}}>
              Please select a valid JSON file:<br/>
              <input ref={this.file_input}
              type='file' accept='.json,application/json'
              onChange={null}/>
            </form>
          </div>
        </div>
      }
      />
    );
  }
}

export default FileLoadModal;
