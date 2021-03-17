import React from 'react';
import Modal from '../Modal';
import './FileLoadModal.scss';

class FileLoadModal extends React.Component {
  constructor(props) {
    super(props);
    this.file_input = React.createRef();
    this.state = {
      file_selected: false,
      is_loading: false,
      is_invalid: false
    }
    this.handleClose = () => props.handleToolbar('set-file-operation', null);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange() {
    this.setState({
      file_selected: Boolean(this.file_input.current.files.length),
      is_invalid: false
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    if (this.file_input.current.files.length) {
      this.setState({is_loading: true});
      const file = this.file_input.current.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = this.props.handleToolbar('load-from-text', reader.result);
        switch(result) {
          case 'success':
            this.handleClose();
            this.props.handleToolbar('set-dropdown', null);
            break;
          case 'user-cancel':
            this.setState({is_loading: false});
            break;
          case 'invalid':
            this.setState({is_loading: false, is_invalid: true});
            break;
          default: console.warn(`FileLoadModal: Unrecognized file load result "${result}"`);
        }
      }
      reader.readAsText(file);
    }
  }

  render() {
    return (
      <Modal
        title='Load File'
        handleClose={this.handleClose}
      >
        <div className='FileLoadModal flex-center'>
          <div className='content'>
          <form action='' disabled={this.state.is_loading}
          onSubmit={this.handleSubmit}>
            <label htmlFor='file'>Please select a valid JSON file:</label><br/>
            <input name='file' ref={this.file_input}
            type='file' accept='.json,application/json'
            onChange={this.handleChange}
            disabled={this.state.is_loading}/><br/>
            <button type='submit'
            disabled={this.state.is_invalid || this.state.is_loading
              || !this.state.file_selected}>Choose</button>
          </form>
          {this.state.is_invalid &&
          <span className='invalid-message'>
            This file does not contain a valid Kaleidoscope save state. Please select
            a different file.
          </span>}
          </div>
        </div>
      </Modal>
    );
  }

  componentDidMount() {
    this.file_input.current.focus();
  }
}

export default FileLoadModal;
