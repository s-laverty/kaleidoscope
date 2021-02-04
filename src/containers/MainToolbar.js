import React from 'react';
import './MainToolbar.css';
import ToolbarDropdown from '../ToolbarDropdown';
import ToolbarButton from '../ToolbarButton';
import WhitePlus from '../assets/white-plus.svg';
import RedX from '../assets/red-x.svg';
import ColorPickerIcon from '../assets/color-picker-icon.svg';

class MainToolbar extends React.Component {
  constructor(props) {
    super(props)
    this.color_picker_input = React.createRef();
  }

  render() {
    const colors = [];
      for (let i = 0; i < this.props.colors.length; ++i) {
        colors.push(<ToolbarButton key={i}
        onClick={() => this.props.handleToolbar('color', i)}
        selected={this.props.selected_color_index === i}
        text={`Color #${i+1}`}
        icon={{
          border: true,
          style: {backgroundColor: this.props.colors[i]}
        }}/>);
      }
    return (
      <div className='MainToolbar'>
        <span className='title flex-center'>Kaleidoscope</span>
        <ToolbarDropdown
        name='File'
        buttons={[
          <ToolbarButton key={'load'}
          text='Load'
          onClick={() => this.props.handleToolbar('load')}
          />,
          <ToolbarButton key={'save'}
          text='Save'
          onClick={() => this.props.handleToolbar('save')}
          />
        ]}
        />
        <ToolbarDropdown
        name='Options'
        disabled={!['fill','change-color'].includes(this.props.selected_tool)}
        force_open={this.props.selected_tool === 'change-color'}
        buttons={[
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
          <ToolbarButton
          text='Remove Color'
          icon={{
            src: RedX,
            style: {backgroundColor: 'white'}
          }}
          onClick={() => this.props.handleToolbar('remove-color')}/>
        ]}/>
        <div className='tools-wrapper'>
          {colors}
          <ToolbarButton
          text='Add Color'
          icon={{src: WhitePlus}}
          onClick={() => this.props.handleToolbar('add-color')}
          />
          <ToolbarButton
          text='Erase'
          icon={{
            src: RedX,
            style: {backgroundColor: 'white'}
          }}
          selected={this.props.selected_tool === 'erase'}
          onClick={() => this.props.handleToolbar('erase')}
          />
        </div>
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

export default MainToolbar;
