import './Modal.scss';
import ToolbarButton from './ToolbarButton';

function Modal(props) {
  return (
    <div className='Modal flex-center'>
      <div className='window subtle-shadow'>
        <div className='title-bar'>
          <span className='title'>{props.title}</span>
          <ToolbarButton
            onClick={props.handleClose}
          >
            <span className='close-icon'/>
          </ToolbarButton>
        </div>
        <div className='content'>{props.children}</div>
      </div>
    </div>
  )
}

export default Modal;
