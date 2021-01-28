import React from 'react';
import './OptionsTray.css';

class OptionsTray extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: false
    };
    this.color_picker_input = React.createRef();
  }
  render() {
    let className = 'OptionsTray';
    let options_list = null;
    if (this.state.collapsed) className += ' collapsed';
    switch (this.props.selected_tool) {
      case 'fill':
      case 'change-color':
        options_list = (
          <div className='tool-wrapper'>
            <button className={'change-color tool' +
              (this.props.selected_tool === 'change-color' ? ' selected' : '')}
            onClick={() => this.props.handleToolbar('change-color-click')}>
              <input type='color' ref={this.color_picker_input}
              value={this.props.color_picker_value}
              onClick={e => e.stopPropagation()}
              onChange={e => this.props.handleToolbar('change-color', e.target.value)}
              onSelect={()=>alert('hello?')}/>
              <span className='icon border'></span><br/>Change Color
            </button>
            <button className='remove-color tool'
            onClick={() => this.props.handleToolbar('remove-color')}>
              <span className='icon'></span><br/>Remove Color
            </button>
          </div>
        );
        break;
      default:
        className += ' hidden';
    }
    return (
      <div className={className}>
        <div className='tray toolbar'>
          <span className='title'>Options</span>
          {options_list}
        </div>
        <div className='collapse-popout toolbar'>
          <button className='collapse'
            onClick={() => this.setState({collapsed: !this.state.collapsed})}>
            <span className='icon'></span>
          </button>
        </div>
      </div>
    );
  }
  componentDidUpdate() {
    if (this.props.will_pick_color) {
      this.color_picker_input.current.onchange =
        () => this.props.handleToolbar('change-color-close');
      this.color_picker_input.current.click();
    }
  }
}

export default OptionsTray;
