import React from 'react';
import './HexTools.css';

class HexTools extends React.Component {
  constructor(props) {
    super(props);
    this.color_picker_input = React.createRef();
    this.will_pick_color = false;
    this.handleChangeColor = this.handleChangeColor.bind(this);
    this.handleAddColor = this.handleAddColor.bind(this);
  }
  handleAddColor() {
    this.props.handleToolbar('new-color');
    this.will_pick_color = true;
  }
  handleChangeColor() {
    this.props.handleToolbar('color-picker', this.props.colors[this.props.selected_color_index]);
    this.will_pick_color = true;
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
        <button className={'add-color'}
        onClick={this.handleAddColor}><span className='icon'></span><br/>Add Color</button>
        <button className={'color-picker'}
        disabled={color_picker_disabled}
        onClick={this.handleChangeColor}>
          <input type='color' ref={this.color_picker_input}
          value={this.props.color_picker_value}
          onClick={e => e.stopPropagation()}
          onChange={e => this.props.handleToolbar('color-picker', e.target.value)}
          disabled={color_picker_disabled}/>
          <span className='icon border'></span><br/>
          Change Color
        </button>
        <button className={erase_className}
          onClick={() => this.props.handleToolbar('erase')}>
            <span className='icon'></span><br/>Erase
        </button>
      </div>
    );
  }
  componentDidUpdate() {
    if (this.will_pick_color) {
      this.will_pick_color = false;
      this.color_picker_input.current.click();
      return;
    }
  }
}

export default HexTools;
