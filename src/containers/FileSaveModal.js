import React from 'react';
import Modal from '../Modal';

class FileSaveModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filename: 'Kaleidoscope project',
      fileURI: null,
      will_download: false
    }
    this.handleClose = () => props.handleToolbar('set-file-operation', null);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.filename_input = React.createRef();
    this.download_link = React.createRef();
  }

  handleSubmit(e) {
    e.preventDefault();
    const fileURI = this.props.handleToolbar('get-save-uri');
    this.setState({fileURI: fileURI, will_download: true});
  }

  render() {
    return (
      <Modal
        title='Save Project'
        handleClose={this.handleClose}
      >
        <div className='FileSaveModal flex-center'>
          <form action=''
          onSubmit={this.handleSubmit}>
            <label htmlFor='filename'>Filename: </label>
            <input name='filename' type='text' ref={this.filename_input}
            value={this.state.filename}
            onChange={e => this.setState({filename: e.target.value})}/>.json<br/>
            <button type='submit'>Save</button>
          </form>
          {this.state.will_download && 
          <a ref={this.download_link}
          href={'data:application/json,' + this.state.fileURI}
          download={this.state.filename + '.json'}>Click here to save your project</a>}
        </div>
      </Modal>
    );
  }

  componentDidMount() {
    this.filename_input.current.focus();
    this.filename_input.current.select();
  }

  componentDidUpdate() {
    if (this.state.will_download) {
      this.download_link.current.click();
      this.setState({will_download: false});
    }
  }
}

export default FileSaveModal;
