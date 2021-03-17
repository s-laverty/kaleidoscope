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
    const {current, handleToolbar} = this.props;
    const {active_tool, active_option} = current;
    return (
      <ToolbarDropdown
        className='OptionsDropdown'
        title='Options'
        collapsed={this.props.collapsed}
        handleToggle={() => handleToolbar('set-dropdown', 'options')}
        disabled={!['color', 'erase'].includes(active_tool)}
        force_open={active_option === 'change-color'}
      >
        {active_tool === 'color' && <>
          <ToolbarButton
            text='Change Color'
            icon={{border: true, src: ColorPickerIcon}}
            selected={active_option === 'change-color'}
            onClick={() => handleToolbar('set-option', 'change-color-click')}
          >
            <input type='color' ref={this.color_picker_input}
              value={current.colors[current.active_color_index]}
              onClick={e => e.stopPropagation()}
              onChange={e => handleToolbar('change-color', e.target.value)}
            />
          </ToolbarButton>
          <ToolbarButton
            text='Ink Dropper'
            selected={active_option === 'ink-dropper'}
            onClick={() => handleToolbar('set-option', 'ink-dropper')}
          />
          <ToolbarButton
            text='Remove Color'
            icon={{
              src: RedX, style: {backgroundColor: 'white'}
            }}
            onClick={() => handleToolbar('remove-color')}
          />
        </>}
        {active_tool === 'remove' &&
          <ToolbarButton
            text='Clear All'
            icon={{
              src: RedX, style: {backgroundColor: 'white'}
            }}
            onClick={() => handleToolbar('clear-all')}
          />
        }
      </ToolbarDropdown>
    );
  }

  componentDidUpdate() {
    const {current: {active_option}, handleToolbar} = this.props;
    if (active_option === 'change-color-click') {
      this.color_picker_input.current.onchange =
        () => handleToolbar('set-option', null);
      this.color_picker_input.current.click();
    }
  }
}

export default OptionsDropdown;
