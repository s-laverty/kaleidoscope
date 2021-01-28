import React from 'react';
import './ToolsMenu.css';
import MainToolbar from './MainToolbar';
import OptionsTray from './OptionsTray';

class ToolsMenu extends React.Component {
  render() {
    return <div className='ToolsMenu'>
      <MainToolbar
        selected_tool={this.props.selected_tool}
        colors={this.props.colors}
        selected_color_index={this.props.selected_color_index}
        handleToolbar={this.props.handleToolbar}
      />
      <OptionsTray
        selected_tool={this.props.selected_tool}
        color_picker_value={this.props.color_picker_value}
        will_pick_color={this.props.will_pick_color}
        handleToolbar={this.props.handleToolbar}
      />
    </div>
  }
}

export default ToolsMenu;
