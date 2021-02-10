import './ToolbarButton.scss';

function ToolbarButton(props) {
  let className=['ToolbarButton'];
  if (props.selected) className.push('selected');
  let icon_className = ['icon'];
  if (props.icon && props.icon.border) icon_className.push('border');
  return (
    <button className={className.join(' ')}
    onClick={props.onClick}
    disabled={props.disabled}>
      {props.icon && (props.icon.src ?
        <img className={icon_className.join(' ')}
        src={props.icon.src}
        alt={props.icon.alt}
        style={props.icon.style}/>
        :
        <span className={icon_className.join(' ')}
        style={props.icon.style}/>)
      }
      {props.icon && <br/>}
      {props.text}
      {props.custom}
    </button>
  );
}

export default ToolbarButton;
