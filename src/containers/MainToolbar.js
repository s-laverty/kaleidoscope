import React from 'react';
import './MainToolbar.css';
import HexTools from './HexTools.js';

class MainToolbar extends React.Component {
  
  render() {
    const HexTools_props = {
      colorchoices: this.props.colorchoices,
      selectedcolorindex: this.props.selectedcolorindex,
      handleColorChoiceClick: this.props.handleColorChoiceClick
    }
    return <div className='MainToolbar'>
      <span className='title'>Kaleidoscope</span>
      <HexTools {...HexTools_props}></HexTools>
    </div>
  }
}

export default MainToolbar;
