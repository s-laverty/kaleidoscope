import './ToolbarButton.scss';

function ToolbarButton(props) {
  const {
    selected=false,
    icon=null,
    text=null,
    children=null,
    ...other
  } = props;
  let className='ToolbarButton';
  if (selected) className += ' selected';
  let icon_className = 'icon';
  if (icon && icon.border) icon_className += ' border';
  return (
    <button className={className}
    {...other}>
      {props.icon && (props.icon.src ?
        <img className={icon_className}
        src={props.icon.src}
        alt={props.icon.alt}
        style={props.icon.style}/>
        :
        <span className={icon_className}
        style={props.icon.style}/>)
      }
      {icon && <br/>}
      {text}
      {children}
    </button>
  );
}

export default ToolbarButton;
