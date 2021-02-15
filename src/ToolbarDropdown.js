import React from 'react';
import './ToolbarDropdown.scss';
import ToolbarButton from './ToolbarButton';

class ToolbarDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: true,
      transitioning: false
    }
  }
  render() {
    let className = ['ToolbarDropdown'];
    if (this.state.collapsed) {
      className.push('collapsed');
      if (!this.state.transitioning) className.push('hidden');
    }
    if (this.props.disabled) className.push('disabled');
    if (this.props.force_open) className.push('force-open');
    return (
      <div className={className.join(' ')}>
        <ToolbarButton
        text={this.props.name}
        custom={<span className='dropdown-icon'></span>}
        disabled={this.props.disabled}
        onClick={() => this.setState(state => ({collapsed: !state.collapsed, transitioning: true}))}
        />
        <hr className='drop-list-separator'/>
        <div className='drop-list subtle-shadow'
        onTransitionEnd={e => e.propertyName === 'opacity' && this.setState({transitioning: false})}>
          {this.props.buttons}
        </div>
      </div>
    );
  }
}

export default ToolbarDropdown;
