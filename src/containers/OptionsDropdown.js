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
    if (this.props.selected_tool === 'color') {
      buttons.push(
        <ToolbarButton key={'change-color'}
          text='Change Color'
          icon={{border: true, src: ColorPickerIcon}}
          selected={this.props.selected_option === 'change-color'}
          onClick={() => this.props.handleToolbar('change-color-click')}
        >
          <input type='color' ref={this.color_picker_input}
            value={this.props.color_picker_value}
            onClick={e => e.stopPropagation()}
            onChange={e => this.props.handleToolbar('change-color', e.target.value)}
          />
        </ToolbarButton>,
        <ToolbarButton key={'ink-dropper'}
          text='Ink Dropper'
          selected={this.props.selected_option === 'ink-dropper'}
          onClick={() => this.props.handleToolbar('ink-dropper')}
        />,
        <ToolbarButton key={'remove-color'}
          text='Remove Color'
          icon={{
            src: RedX, style: {backgroundColor: 'white'}
          }}
          onClick={() => this.props.handleToolbar('remove-color')}
        />
      );
      if (this.props.selected_option === 'change-color') force_open = true;
    } else if (this.props.selected_tool === 'erase') {
      buttons.push(
        <ToolbarButton key={'clear-all'}
          text='Clear All'
          icon={{
            src: RedX, style: {backgroundColor: 'white'}
          }}
          onClick={() => this.props.handleToolbar('clear-all')}
        />
      );
    } else disabled = true;
    return (
      <ToolbarDropdown
        className='OptionsDropdown'
        title='Options'
        collapsed={this.props.collapsed}
        handleToggle={this.props.handleToggle}
        disabled={disabled}
        force_open={force_open}
      >
        {buttons}
      </ToolbarDropdown>
    );
  }

  componentDidUpdate() {
    if (this.props.selected_option === 'change-color-click') {
      this.color_picker_input.current.onchange =
        () => this.props.handleToolbar('change-color-close');
      this.color_picker_input.current.click();
    }
  }
}

export default OptionsDropdown;
