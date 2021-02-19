import './ToolbarButton.scss';

function ToolbarButton(props) {
  let className='ToolbarButton';
  if (props.selected) className += ' selected';
  let icon_className = 'icon';
  if (props.icon && props.icon.border) icon_className += ' border';
  return (
    <button className={className}
    onClick={props.onClick}
    disabled={props.disabled}>
      {props.icon && (props.icon.src ?
        <img className={icon_className}
        src={props.icon.src}
        alt={props.icon.alt}
        style={props.icon.style}/>
        :
        <span className={icon_className}
        style={props.icon.style}/>)
      }
      {props.icon && <br/>}
      {props.text}
      {props.children}
    </button>
  );
}

export default ToolbarButton;
