import React from 'react';
import './HexTools.css';

class HexTools extends React.Component {
  constructor(props) {
    super(props);
    this.color_picker_input = React.createRef();
  }
  handleAddColor() {

  }
  render() {
    const choices = [];
      for (let i = 0; i < this.props.colors.length; ++i) {
        let className = 'color-choice';
        if (this.props.selected_color_index === i) className += ' selected';
        choices.push(<button key={i} className={className}
          onClick={() => this.props.handleToolbar('color', i)}>
          <span className='icon border' style={{backgroundColor: this.props.colors[i]}}></span><br/>
          Color #{i+1}
        </button>);
      }
    let erase_className = 'erase';
    if (this.props.selected_tool === 'erase') erase_className += ' selected';
    const color_picker_disabled = this.props.selected_tool !== 'fill';
    return (
      <div className='HexTools'>
        {choices}
        <button className={'add-color'}><span className='icon'></span><br/>Add Color</button>
        <button className={'color-picker'}
        disabled={color_picker_disabled}
        onClick={() => this.color_picker_input.current.click()}>
          <input type='color' ref={this.color_picker_input}
          value={this.props.color_picker_value}
          onChange={e => this.props.handleToolbar('color-picker', e.target.value)}
          disabled={this.props.selected_tool !== 'fill'}/>
          <span className='icon border'></span><br/>
          Pick Color
        </button>
        <button className={erase_className}
          onClick={() => this.props.handleToolbar('erase')}>
            <span className='icon'></span><br/>Erase
        </button>
      </div>
    );
  }
}

export default HexTools;
