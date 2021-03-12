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
    const {
      className: alias=null,
      title, handleToggle,
      collapsed=true,
      disabled=false,
      force_open=false,
      children=null,
      ...other
    } = this.props;
    let className = 'ToolbarDropdown';
    if (collapsed) {
      className += ' collapsed';
      if (!this.state.transitioning) className += ' no-tr';
    }
    if (disabled) className += ' disabled';
    if (force_open) className += ' force-open';
    if (alias) className += ' ' + alias;
    return (
      <div className={className} {...other}>
        <ToolbarButton
          text={title}
          disabled={disabled}
          onClick={handleToggle}
        >
          <span className='dropdown-icon'></span>
        </ToolbarButton>
        <hr className='drop-list-separator'/>
        <div className='drop-list subtle-shadow'
          onTransitionEnd={e => e.propertyName === 'opacity' && this.setState({transitioning: false})}
        >
          {children}
        </div>
      </div>
    );
  }

  componentDidUpdate(prevProps) {
    if (this.props.collapsed !== prevProps.collapsed) this.setState({transitioning: true});
  }
}

export default ToolbarDropdown;
