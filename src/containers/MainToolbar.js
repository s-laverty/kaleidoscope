import React from 'react';
import './MainToolbar.css';

class MainToolbar extends React.Component {
  render() {
    const colors = [];
      for (let i = 0; i < this.props.colors.length; ++i) {
        let className = 'color-choice tool';
        if (this.props.selected_color_index === i) className += ' selected';
        colors.push(<button key={i} className={className}
          onClick={() => this.props.handleToolbar('color', i)}>
          <span className='icon border' style={{backgroundColor: this.props.colors[i]}}></span><br/>
          Color #{i+1}
        </button>);
      }
    let erase_className = 'erase tool';
    if (this.props.selected_tool === 'erase') erase_className += ' selected';
    const color_picker_disabled = this.props.selected_tool !== 'fill';
    return (
      <div className='MainToolbar'>
        <div className='toolbar'>
          <span className='title'>Kaleidoscope</span>
          <div className='tools-wrapper'>
            {colors}
            <button className={'add-color tool'}
            onClick={() => this.props.handleToolbar('add-color')}>
              <span className='icon'></span><br/>Add Color
            </button>
            <button className={erase_className}
            onClick={() => this.props.handleToolbar('erase')}>
              <span className='icon'></span><br/>Erase
            </button>
          </div>
       </div>
      </div>
    );
  }
}

export default MainToolbar;
