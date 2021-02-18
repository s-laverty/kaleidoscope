import React from 'react';
import ToolbarDropdown from '../ToolbarDropdown';
import ToolbarButton from '../ToolbarButton';
import './OptionsDropdown.scss';
import ColorPickerIcon from '../assets/color-picker-icon.svg';
import RedX from '../assets/red-x.svg';

class OptionsDropdown extends React.Component {
  constructor(props) {
    super(props)
    this.color_picker_input = React.createRef();
  }

  render() {
    let disabled=false;
    let force_open = false;
    const buttons = [];
    if (['fill','change-color'].includes(this.props.selected_tool)) {
      buttons.push(
        <ToolbarButton key={'change-color'}
        text='Change Color'
        icon={{border: true, src: ColorPickerIcon}}
        custom={
          <input type='color' ref={this.color_picker_input}
          value={this.props.color_picker_value}
          onClick={e => e.stopPropagation()}
          onChange={e => this.props.handleToolbar('change-color', e.target.value)}/>
        }
        selected={this.props.selected_tool === 'change-color'}
        onClick={() => this.props.handleToolbar('change-color-click')}
        />,
        <ToolbarButton key={'remove-color'}
        text='Remove Color'
        icon={{
          src: RedX,
          style: {backgroundColor: 'white'}
        }}
        onClick={() => this.props.handleToolbar('remove-color')}/>
      );
      if (this.props.selected_tool === 'change-color') force_open = true;
    } else disabled = true;
    return (
      <ToolbarDropdown
        className='OptionsDropdown'
        name='Options'
        collapsed={this.props.collapsed}
        handleToggle={this.props.handleToggle}
        disabled={disabled}
        force_open={force_open}
        buttons={buttons}
      />
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

export default OptionsDropdown;
