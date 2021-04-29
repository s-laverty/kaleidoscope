import { useRef } from 'react';
import './Slider.scss';

const Slider = ({className, offset, onScroll, onDragStart, onDragEnd, type, smooth=false}) => {
  const wrapper = useRef();
  className = (className?.concat(' ') ?? '') +
    'Slider rounded-pill border border-secondary shadow bg-white-transparent';
  let top = `${offset * 100}%`;
  let bottom = `${(1 - offset) * 100}%`;
  return (
    <div className={className}>
      <div className='w-100 h-100 rounded-pill d-flex flex-column justify-content-between overflow-hidden'>
        <div className={'scroll-jump btn-outline-secondary w-100 cursor-pointer '
        + 'd-flex justify-content-center'} style={{height: top}}
        onClick={() => onScroll(Math.max(0, offset - 0.1))}>
          {type === 'zoom' && <i className='bi-zoom-in align-self-start'/>}
        </div>
        <div className={'scroll-jump btn-outline-secondary w-100 cursor-pointer '
        + 'd-flex justify-content-center'} style={{height: bottom}}
        onClick={() => onScroll(Math.min(1, offset + 0.1))}>
          {type === 'zoom' && <i className='bi-zoom-out align-self-end'/>}
        </div>
      </div>
      <div className='dial-wrapper position-absolute' ref={wrapper}>
        <div className={'dial btn-primary rounded-circle position-absolute p-0 ' +
        'shadow border border-secondary cursor-grab d-flex justify-content-center'}
        style={{top: top}}
        onMouseDown={e => {
          let {top, height} = e.target.getBoundingClientRect();
          let dial_offset = e.clientY - top - height / 2;
          const onMouseMove = e => {
            let {clientY} = e;
            let {top, height} = wrapper.current.getBoundingClientRect();
            let offset = Math.max(0, Math.min(1, (clientY - dial_offset - top) / height));
            onScroll(offset);
          };
          const onCancel = () => {
            window.removeEventListener('mousemove', onMouseMove);
            onDragEnd?.();
          }
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onCancel, {once: true});
          window.addEventListener('mouseleave', onCancel, {once: true});
          onDragStart?.();
        }}>
          <i className='bi-chevron-expand h5 m-0 align-self-center'/>
        </div>
      </div>
    </div>
  );
};

export default Slider;
