import './Modal.css';
import ToolbarButton from './ToolbarButton';

function Modal(props) {
  return (
    <div className='Modal flex-center'>
      <div className='window'>
        <div className='title-bar'>
          <span className='title'>{props.title}</span>
          <ToolbarButton
            custom={<span className='close-icon'/>}
          />
        </div>
      </div>
    </div>
  )
}

export default Modal;
