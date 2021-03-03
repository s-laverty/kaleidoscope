import React from 'react';
import './ToolbarButton.scss';

class ToolbarButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dragover_counter: 0
    }
  }

  render() {
    const {
      selected=false,
      icon=null,
      text=null,
      children=null,
      onDragEnter=null,
      onDragLeave=null,
      onDrop=null,
      ...other
    } = this.props;
    let className='ToolbarButton';
    if (this.props.className) className += ' ' + this.props.className;
    if (selected) className += ' selected';
    if (this.state.dragover_counter > 0) className += ' dragover';
    let icon_className = 'icon';
    if (icon && icon.border) icon_className += ' border';
    return (
      <button className={className}
      onDragEnter={e => {
        if (onDragEnter) onDragEnter(e);
        if (e.defaultPrevented)
          this.setState(state => ({dragover_counter: state.dragover_counter + 1}));
      }}
      onDragLeave={e => {
        if (onDragLeave) onDragLeave(e);
        this.setState(state => {
          if (state.dragover_counter > 0)
            return {dragover_counter: state.dragover_counter - 1};
        });
      }}
      onDrop={e => {
        if (onDrop) onDrop(e);
        this.setState({dragover_counter: 0});
      }}
      {...other}>
        {this.props.icon && (this.props.icon.src ?
          <img className={icon_className}
          src={this.props.icon.src}
          alt={this.props.icon.alt}
          style={this.props.icon.style}/>
          :
          <span className={icon_className}
          style={this.props.icon.style}/>)
        }
        {icon && <br/>}
        {text}
        {children}
      </button>
    );
  }
}

export default ToolbarButton;