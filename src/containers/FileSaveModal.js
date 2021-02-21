import React from 'react';
import Modal from '../Modal';

class FileSaveModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filename: 'Kaleidoscope project',
      will_download: false
    }
    this.download_link = React.createRef();
    this.fileURI = null;
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit() {
    this.fileURI = this.props.getDownloadURI();
    this.setState({will_download: true});
  }

  render() {
    return (
      <Modal
      title='Save File'
      handleClose={this.props.handleClose}
      >
        <div className='FileSaveModal flex-center'>
          <div className='content'>
            <form action=''
            onSubmit={e => {this.handleSubmit(); e.preventDefault();}}>
              <label htmlFor='filename'>Filename: </label>
              <input name='filename' type='text' value={this.state.filename}
              onChange={e => this.setState({filename: e.target.value})}
              onKeyPress={e => {console.log(e);}}/>.json<br/>
              <button type='submit'>Save</button>
            </form>
            {this.state.will_download && 
            <a ref={this.download_link}
            href={'data:application/json,' + this.fileURI}
            download={this.state.filename + '.json'}>Click here to save your project</a>}
          </div>
        </div>
      </Modal>
    );
  }

  componentDidUpdate() {
    if (this.state.will_download) {
      this.download_link.current.click();
      this.setState({will_download: false});
    }
  }
}

export default FileSaveModal;
