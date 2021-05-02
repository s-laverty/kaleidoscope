import { useEffect, useRef, useState } from 'react';
import HexFreestyleDisplay from './HexFreestyleDisplay';
import HexTessellateDisplay from './HexTessellateDisplay';
import ColorIcon from '../components/ColorIcon';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { MAX_ZOOM, MIN_ZOOM, TOOLS } from '../utils/KaleidoscopeUtils';
import Slider from '../components/Slider';

const getDimensions = (container, setDims) =>
  setDims([container.current.clientWidth, container.current.clientHeight]);

const DisplayArea = ({sidebar, mode, current, dispatch}) => {
  const [dims, setDims] = useState([0,0]);
  const container = useRef();

  useEffect(() => {
    let handler = () => getDimensions(container, setDims);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  useEffect(() => getDimensions(container, setDims), [sidebar]);

  let className = 'h-100';
  if (current.tool === 'pan') className += ' cursor-grab';

  let onWheel;
  if (current.zoom) onWheel =
    e => dispatch({type: 'zoom', delta: e.deltaY});

  return (<>
    <div className='h-100 overflow-hidden user-select-none' ref={container}
    onWheel={onWheel}>
      <div className={className} onMouseDown={() => {
        if (current.tool === 'pan') {
          const onMouseMove = e => {
            let ds = [e.movementX, e.movementY]
            dispatch({type: 'pan', ds});
          };
          const onCancel = () => {
            window.removeEventListener('mousemove', onMouseMove);
            dispatch({type: 'set', name: 'grabbing', value: false});
          }
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onCancel, {once: true});
          window.addEventListener('mouseleave', onCancel, {once: true});
          dispatch({type: 'set', name: 'grabbing', value: true});
        }
      }}>
        {mode === 'hex-freestyle' &&
          <HexFreestyleDisplay dims={dims} {...current} dispatch={dispatch}/>
        }
        {mode === 'hex-tessellate' &&
          <HexTessellateDisplay dims={dims} {...current} dispatch={dispatch}/>
        }
      </div>
      {!sidebar &&
        <Button variant='outline-dark' 
        className='position-absolute top-left mt-2 ml-1 shadow bg-white-transparent'
        onClick={() => dispatch({type: 'set', name: 'sidebar', value: true})}>
          <i className='bi-chevron-double-right h4'/>
        </Button>
      }
      <span className={'position-absolute bottom-left bg-white-transparent mb-1 ml-1 '
      + 'border border-secondary shadow px-1 rounded'}>
        {'Tool: '}
        {TOOLS[current.tool] ?? 'None'}
        {current.tool === 'fill-color' && <>
          {' '}
          <ColorIcon color={current.colors[current.color_index]} className='d-inline-block'/>
        </>}
      </span>
      {current.history &&
        <div className='position-absolute top-right mt-2 mr-2 d-flex justify-content-end w-0'>
          <OverlayTrigger
          placement='bottom'
          delay={100}
          overlay={<Tooltip id='undo-button-tooltip'>
            <b>Undo</b> <kbd><kbd>Ctrl</kbd> + <kbd>z</kbd></kbd>
            {current.history_index === 0 && <>
              <br/><i>Unavailable</i>
            </>}
          </Tooltip>}>
            <div className='d-inline-block rounded mr-2' tabIndex={0}>
              <Button variant='outline-dark'
              disabled={current.history_index === 0}
              onClick={() => dispatch({type: 'undo'})}
              className='shadow bg-white-transparent'>
                <i className='bi-arrow-90deg-left h4'/>
              </Button>
            </div>
          </OverlayTrigger>
          <OverlayTrigger
          placement='bottom'
          delay={100}
          overlay={<Tooltip id='redo-button-tooltip'>
            <b>Redo</b> <kbd><kbd>Ctrl</kbd> + <kbd>y</kbd></kbd>
            {current.history_index + 1 === current.history.length && <>
              <br/><i>Unavailable</i>
            </>}
          </Tooltip>}>
            <div className='d-inline-block rounded' tabIndex={0}>
              <Button variant='outline-dark'
              disabled={current.history_index + 1 === current.history.length}
              onClick={() => dispatch({type: 'redo'})}
              className='shadow bg-white-transparent'>
                <i className='bi-arrow-90deg-right h4'/>
              </Button>
            </div>
          </OverlayTrigger>
        </div>
      }
      {current.zoom &&
        <OverlayTrigger
        placement='left'
        delay={100}
        overlay={<Tooltip id='zoom-slider-tooltip'>Zoom</Tooltip>}>
          <div className='h-50 position-absolute right-middle mr-3 rounded-pill' tabIndex={0}>
            <Slider className='h-100' type='zoom'
            offset={(MAX_ZOOM - current.zoom) / (MAX_ZOOM - MIN_ZOOM)}
            onScroll={offset =>
              dispatch({type: 'zoom', zoom: MAX_ZOOM - (MAX_ZOOM - MIN_ZOOM) * offset})
            }
            onDragStart={() => dispatch({type: 'set', name: 'grabbing', value: true})}
            onDragEnd={() => dispatch({type: 'set', name: 'grabbing', value: false})}
            />
          </div>
        </OverlayTrigger>
      }
    </div>
  </>);
};

export default DisplayArea;
