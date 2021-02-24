import React from 'react';
import './ToolbarDropdown.scss';
import ToolbarButton from './ToolbarButton';

class ToolbarDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      transitioning: false
    }
    this.className = 'ToolbarDropdown';
    if (props.className) this.className += ' ' + props.className;
  }

  render() {
    let className = this.className;
    if (this.props.collapsed) {
      className += ' collapsed';
      if (!this.state.transitioning) className += ' no-tr';
    }
    if (this.props.disabled) className += ' disabled';
    if (this.props.force_open) className += ' force-open';
    return (
      <div className={className}>
        <ToolbarButton
          text={this.props.title}
          disabled={this.props.disabled}
          onClick={this.props.handleToggle}
        >
          <span className='dropdown-icon'></span>
        </ToolbarButton>
        <hr className='drop-list-separator'/>
        <div className='drop-list subtle-shadow'
          onTransitionEnd={e => e.propertyName === 'opacity' && this.setState({transitioning: false})}
        >
          {this.props.children}
        </div>
      </div>
    );
  }

  componentDidUpdate(prevProps) {
    if (this.props.collapsed !== prevProps.collapsed) this.setState({transitioning: true});
  }
}

export default ToolbarDropdown;
