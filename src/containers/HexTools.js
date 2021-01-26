import React from 'react';
import './HexTools.css';

class HexTools extends React.Component {
  constructor(props) {
    super(props);
    this.color_picker_input = React.createRef();
    this.handleColorPicker = this.handleColorPicker.bind(this);
  }

  handleColorPicker(e) {
    console.log(e);
  }

  render() {
    const choices = [];
      for (let i = 0; i < this.props.colors.length; ++i) {
        let className = 'color-choice';
        if (this.props.selected_color_index === i) className += ' selected';
        choices.push(<button key={i} className={className}
          onClick={() => this.props.handleToolbarClick('color', i)}>
          <span className='icon' style={{backgroundColor: this.props.colors[i]}}></span><br/>
          Color #{i+1}
        </button>);
      }
    let erase_className = 'erase';
    if (this.props.selected_tool === 'erase') erase_className += ' selected';
    const color_picker_disabled = this.props.selected_tool !== 'fill';
    return (
      <div className='HexTools'>
        {choices}
        <button className={'color-picker'}
        disabled={color_picker_disabled}
        onClick={() => this.color_picker_input.current.click()}>
          <input type='color' ref={this.color_picker_input}
          onInput={this.handleColorPicker}
          disabled={this.props.selected_tool !== 'fill'}/>
          <span className='icon'></span><br/>
          Pick Color
        </button>
        <button className={erase_className}
          onClick={() => this.props.handleToolbarClick('erase')}>
            <span className='icon'></span><br/>Erase
        </button>
      </div>
    );
  }
}

export default HexTools;
