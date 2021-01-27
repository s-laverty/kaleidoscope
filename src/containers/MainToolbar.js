import React from 'react';
import './MainToolbar.css';
import HexTools from './HexTools.js';

class MainToolbar extends React.Component {
  
  render() {
    const HexTools_props = {
      selected_tool: this.props.selected_tool,
      colors: this.props.colors,
      selected_color_index: this.props.selected_color_index,
      color_picker_value: this.props.color_picker_value,
      handleToolbar: this.props.handleToolbar
    }
    return <div className='MainToolbar'>
      <span className='title'>Kaleidoscope</span>
      <HexTools {...HexTools_props}></HexTools>
    </div>
  }
}

export default MainToolbar;
