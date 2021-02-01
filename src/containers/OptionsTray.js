import React from 'react';
import './OptionsTray.css';

class OptionsTray extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: false,
      transitioning: false
    };
    this.color_picker_input = React.createRef();
  }
  render() {
    let className = 'OptionsTray';
    let options_list = null;
    if (this.state.collapsed) className += ' collapsed';
    let tool_wrapper_className = 'tool-wrapper toolbar';
    if (this.state.collapsed && !this.state.transitioning) tool_wrapper_className += ' hidden';
    switch (this.props.selected_tool) {
      case 'fill':
      case 'change-color':
        options_list = (
          <div className={tool_wrapper_className}
          onTransitionEnd={() => this.setState({transitioning: false})}>
            <button className={'change-color tool' +
              (this.props.selected_tool === 'change-color' ? ' selected' : '')}
            onClick={() => this.props.handleToolbar('change-color-click')}
            disabled={this.state.collapsed || this.state.transitioning}>
              <input type='color' ref={this.color_picker_input}
              value={this.props.color_picker_value}
              onClick={e => e.stopPropagation()}
              onChange={e => this.props.handleToolbar('change-color', e.target.value)}
              onSelect={()=>alert('hello?')}/>
              <span className='icon border'></span><br/>Change Color
            </button>
            <button className='remove-color tool'
            onClick={() => this.props.handleToolbar('remove-color')}
            disabled={this.state.collapsed || this.state.transitioning}>
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
        <div className='tray'>
        <div className='toolbar title'>
          <button onClick={() => this.setState({collapsed: !this.state.collapsed, transitioning: true})}>
            Options <span className='icon'></span>
          </button>
        </div>
          {options_list}
        </div>
        {/*<div className='collapse-popout toolbar top'>
          <button className='collapse'
            onClick={() => this.setState({collapsed: !this.state.collapsed})}>
            <span className='icon'></span>
          </button>
        </div>*/}
      </div>
    );
  }
  componentDidUpdate(oldProps, oldState) {
    if (this.props.will_pick_color) {
      this.color_picker_input.current.onchange =
        () => this.props.handleToolbar('change-color-close');
      this.color_picker_input.current.click();
    }
  }
}

export default OptionsTray;
