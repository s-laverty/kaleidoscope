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
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange() {
    this.setState({
      file_selected: Boolean(this.file_input.current.files.length),
      is_invalid: false
    });
  }

  handleSubmit() {
    if (this.file_input.current.files.length) {
      this.setState({is_loading: true});
      const file = this.file_input.current.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (this.props.loadFileText(reader.result)) {
          this.props.handleClose();
        } else {
          this.setState({is_loading: false, is_invalid: true});
        }
      }
      reader.readAsText(file);
    }
  }

  render() {
    return (
      <Modal
      title='Load File'
      handleClose={this.props.handleClose}
      content={
        <div className='FileLoadModal flex-center'>
          <div className='content'>
          <form action='' disabled={this.state.is_loading}
          onSubmit={e => {this.handleSubmit(); e.preventDefault();}}>
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
      }/>
    );
  }
}

export default FileLoadModal;
