import './Modal.scss';
import ToolbarButton from './ToolbarButton';

function Modal(props) {
  return (
    <div className='Modal flex-center'>
      <div className='window subtle-shadow'>
        <div className='title-bar'>
          <span className='title'>{props.title}</span>
          <ToolbarButton
            custom={<span className='close-icon'/>}
            onClick={props.handleClose}
          />
        </div>
        <div className='content'>{props.content}</div>
      </div>
    </div>
  )
}

export default Modal;
