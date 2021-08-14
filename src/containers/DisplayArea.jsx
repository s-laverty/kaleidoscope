import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import ColorIcon from '../components/ColorIcon';
import Slider from '../components/Slider';
import { MAX_ZOOM, MIN_ZOOM, TOOLS } from '../utils/KaleidoscopeUtils';
import HexFreestyleDisplay from './HexFreestyleDisplay';
import HexTessellateDisplay from './HexTessellateDisplay';
/** @typedef {import('react').Dispatch<*>} Dispatch */
/** @typedef {import('react').MouseEventHandler} MouseEventHandler */
/** @typedef {import('react').WheelEventHandler} WheelEventHandler */

/**
 * This component represents the main display area of the application, including HUD elements.
 * @param {object} props
 * @param {boolean} props.sidebar - Whether or not the sidebar is visible.
 * @param {string} props.mode - The current application mode (e.g. 'hex-freestyle').
 * @param {object} props.current - The mode-specific state properties.
 * @param {Dispatch} props.dispatch - The state reducer dispatch function.
 * @returns {JSX.Element}
 */
export default function DisplayArea({ sidebar, mode, current, dispatch }) {

  /** The dimensions of the the display area in pixels. */
  const [dims, setDims] = useState(/** @type {[number, number]} */ ([0, 0]));

  /** The div containing the the display area. */
  const container = useRef(/** @type {Element} */ (null));

  // Reset dimensions on resize or sidebar visibility change.
  const resetDims = () => setDims(
    [container.current.clientWidth, container.current.clientHeight]
  );
  useEffect(() => {
    window.addEventListener('resize', resetDims);
    return () => window.removeEventListener('resize', resetDims);
  }, []);
  useEffect(() => resetDims(), [sidebar]);

  // Add wheel event handler if the current mode has zoom capability.
  /** @type {WheelEventHandler} */
  const onWheel = current.zoom ? (
    e => dispatch({ type: 'zoom', delta: e.deltaY })
  ) : null;

  // Show a grab cursor if pan tool is selected.
  const innerClassName = classNames('h-100', {
    'cursor-grab': current.tool === 'pan'
  });

  // Add mouse down event handler for click and drag panning.
  /** @type {MouseEventHandler} */
  const onPanStart = current.tool === 'pan' ? (
    e => {
      if (e.button !== 0) return;
      // Keep track of window-level mouse movement until the left mouse button is released.
      /** @type {MouseEventHandler} */
      const onMouseMove = e => dispatch({ type: 'pan', ds: [e.movementX, e.movementY] });
      window.addEventListener('mousemove', onMouseMove);
      /** @type {MouseEventHandler} */
      const onMouseUp = e => e.button === 0 && onPanEnd();
      window.addEventListener('mouseup', onMouseUp);
      const onPanEnd = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        dispatch({ type: 'set', name: 'grabbing', value: false });
      };
      window.addEventListener('mouseleave', onPanEnd, { once: true });
      dispatch({ type: 'set', name: 'grabbing', value: true });
    }
  ) : null;

  // Determine whether to display HUD history elements.
  const undoDisabled = current.history && current.history_index === 0;
  const redoDisabled = current.history && current.history_index === current.history.length - 1;

  return (
    <div className='h-100 overflow-hidden user-select-none' ref={container} onWheel={onWheel} >

      {/* Inner display container (behind HUD elements). */}
      <div className={innerClassName} onMouseDown={onPanStart} >
        {mode === 'hex-freestyle' &&
          <HexFreestyleDisplay dims={dims} {...current} dispatch={dispatch} />
        }
        {mode === 'hex-tessellate' &&
          <HexTessellateDisplay dims={dims} {...current} dispatch={dispatch} />
        }
      </div>

      {/* HUD sidebar expand button: display if sidebar is collapsed. */}
      {!sidebar &&
        <Button
          variant='outline-dark'
          className='position-absolute top-left mt-2 ml-1 shadow bg-white-transparent'
          onClick={() => dispatch({ type: 'set', name: 'sidebar', value: true })}
        >
          <i className='bi-chevron-double-right h4' />
        </Button>
      }

      {/* HUD active tool tooltip. */}
      <span
        className={
          'position-absolute bottom-left bg-white-transparent mb-1 ml-1 border border-secondary' +
          ' shadow px-1 rounded'
        }
      >
        Tool: {TOOLS[current.tool] ?? 'None'}
        {current.tool === 'fill-color' && <>
          {' '}
          <ColorIcon color={current.colors[current.color_index]} className='d-inline-block' />
        </>}
      </span>

      {/* HUD undo & redo buttons: display if history is enabled for current mode. */}
      {current.history &&
        <div className='position-absolute top-right mt-2 mr-2 d-flex justify-content-end w-0' >

          {/* Undo button with tooltip. */}
          <OverlayTrigger
            placement='bottom'
            delay={100}
            overlay={
              <Tooltip id='undo-button-tooltip' >
                <b>Undo</b> <kbd><kbd>Ctrl</kbd> + <kbd>z</kbd></kbd>
                {undoDisabled && <>
                  <br />
                  <i>Unavailable</i>
                </>}
              </Tooltip>
            }
          >
            <div className='d-inline-block rounded mr-2' tabIndex={0} >
              <Button
                variant='outline-dark'
                disabled={undoDisabled}
                onClick={() => dispatch({ type: 'undo' })}
                className='shadow bg-white-transparent'
              >
                <i className='bi-arrow-90deg-left h4' />
              </Button>
            </div>
          </OverlayTrigger>

          {/* Redo button with tooltip. */}
          <OverlayTrigger
            placement='bottom'
            delay={100}
            overlay={
              <Tooltip id='redo-button-tooltip' >
                <b> Redo </b> <kbd><kbd> Ctrl </kbd> + <kbd> y </kbd></kbd>
                {redoDisabled && <>
                  <br />
                  <i> Unavailable </i>
                </>}
              </Tooltip>
            }
          >
            <div className='d-inline-block rounded' tabIndex={0} >
              <Button
                variant='outline-dark'
                disabled={redoDisabled}
                onClick={() => dispatch({ type: 'redo' })}
                className='shadow bg-white-transparent'
              >
                <i className='bi-arrow-90deg-right h4' />
              </Button>
            </div>
          </OverlayTrigger>
        </div>
      }

      {/* HUD Zoom slider: display if zoom is enabled for current mode. */}
      {current.zoom &&
        <OverlayTrigger
          placement='left'
          delay={100}
          overlay={<Tooltip id='zoom-slider-tooltip' > Zoom </Tooltip>}
        >
          <div className='h-50 position-absolute right-middle mr-3 rounded-pill' tabIndex={0} >
            <Slider
              className='h-100'
              type='zoom'
              offset={(MAX_ZOOM - current.zoom) / (MAX_ZOOM - MIN_ZOOM)}
              onScroll={offset => dispatch(
                { type: 'zoom', zoom: MAX_ZOOM - (MAX_ZOOM - MIN_ZOOM) * offset }
              )}
              onDragStart={() => dispatch({ type: 'set', name: 'grabbing', value: true })}
              onDragEnd={() => dispatch({ type: 'set', name: 'grabbing', value: false })}
            />
          </div>
        </OverlayTrigger>
      }
    </div>
  );
};
