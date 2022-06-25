import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import ColorIcon from '../components/ColorIcon';
import Slider from '../components/Slider';
import {
  Modes, Names, Tools, Zoom,
} from '../utils/config';
import { DispatchTypes } from '../utils/kaleidoscope';
import HexFreestyleDisplay from './HexFreestyleDisplay';
import HexTessellateDisplay from './HexTessellateDisplay';
/** @typedef {import('../utils/kaleidoscope').Dispatch} Dispatch */
/** @typedef {import('../utils/kaleidoscope').GlobalState} GlobalState */
/** @typedef {import('../utils/kaleidoscope').ModeState} ModeState */

/**
 * This component represents the main display area of the application, including HUD elements.
 * @param {object} props
 * @param {boolean} props.sidebar - Whether or not the sidebar is visible.
 * @param {string} props.mode - The current application mode.
 * @param {ModeState} props.state - The current application state.
 * @param {Dispatch} props.dispatch - The current application dispatch.
 * @returns {JSX.Element}
 */
export default function DisplayArea({
  sidebar, mode, state, dispatch,
}) {
  /** The dimensions of the the display area in pixels. */
  const [dims, setDims] = useState(/** @type {[number, number]} */ ([0, 0]));

  /** The div containing the the display area. */
  const container = useRef(/** @type {Element} */ (null));

  /** Reset dimensions on resize or sidebar visibility change. */
  const resetDims = () => setDims(
    [container.current.clientWidth, container.current.clientHeight],
  );
  useEffect(() => {
    window.addEventListener('resize', resetDims);
    return () => window.removeEventListener('resize', resetDims);
  }, []);
  useEffect(() => resetDims(), [sidebar]);

  /** Add wheel event handler if the current mode has zoom capability. */
  /** @type {React.WheelEventHandler} */
  const onWheel = (event) => {
    let zoom = state.zoom - Zoom.wheelSensitivity * event.deltaY;
    zoom = Math.max(Zoom.min, Math.min(Zoom.max, zoom));
    dispatch({ type: DispatchTypes.zoom, zoom });
  };

  /** Add mouse down event handler for click and drag panning. */
  /** @type {React.MouseEventHandler} */
  const onPanStart = state.tool === Tools.pan ? (
    (startEvent) => {
      /** Only start panning for the left mouse button. */
      if (startEvent.button !== 0) return;

      /** @see GlobalState */
      dispatch({ type: DispatchTypes.globalSet, name: 'grabbing', value: true });

      /**
       * Handles the cancellation of a panning event (removes event handlers).
       * @type {() => void}
       */
      let onCancel;

      /** @type {React.MouseEventHandler} */
      const onMouseMove = (event) => dispatch({
        type: DispatchTypes.pan, ds: [event.movementX, event.movementY],
      });
      window.addEventListener('mousemove', onMouseMove);

      /** @type {React.MouseEventHandler} */
      const onMouseUp = (e) => e.button === 0 && onCancel();
      window.addEventListener('mouseup', onMouseUp);

      window.addEventListener('mouseleave', onCancel, { once: true });

      onCancel = () => {
        /** @see GlobalState */
        dispatch({ type: DispatchTypes.globalSet, name: 'grabbing', value: false });
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  ) : null;

  /** Determine whether to display HUD history elements. */
  const undoDisabled = 'history' in state && state.history.index === 0;
  const redoDisabled = 'history' in state && state.history.index === state.history.records.length - 1;

  /** Determine slider position (max zoom is 0). */

  return (
    <div className="h-100 overflow-hidden user-select-none" ref={container} onWheel={onWheel}>
      {/* Inner display container (behind HUD elements). */}
      <div
        className={classNames('h-100', {
          'cursor-grab': state.tool === Tools.pan,
        })}
        role="none"
        onMouseDown={onPanStart}
      >
        {mode === Modes.hexTessellate && (
          <HexTessellateDisplay dims={dims} state={state} dispatch={dispatch} />
        )}
        {mode === Modes.hexFreestyle && (
          <HexFreestyleDisplay dims={dims} state={state} dispatch={dispatch} />
        )}
      </div>

      {/* HUD sidebar expand button: display if sidebar is collapsed. */}
      {!sidebar && (
        <Button
          variant="outline-dark"
          className="position-absolute top-left mt-2 ml-1 shadow bg-white-transparent"
          onClick={
            /** @see GlobalState */
            () => dispatch({ type: DispatchTypes.globalSet, name: 'sidebar', value: true })
          }
        >
          <i className="bi-chevron-double-right h4" />
        </Button>
      )}

      {/* HUD active tool tooltip. */}
      <span
        className="position-absolute bottom-left bg-white-transparent mb-1 ml-1 border border-secondary shadow px-1 rounded"
      >
        {'Tool: '}
        {Names.tools[state.tool] ?? 'None'}
        {[Tools.colorFill, Tools.colorFlood].includes(state.tool) && (
          <>
            {' '}
            <ColorIcon color={state.colors[state.colorIndex]} className="d-inline-block" />
          </>
        )}
      </span>

      {/* HUD undo & redo buttons: display if history is enabled for current mode. */}
      {'history' in state && (
        <div className="position-absolute top-right mt-2 mr-2 d-flex justify-content-end w-0">
          {/* Undo button with tooltip. */}
          <OverlayTrigger
            placement="bottom"
            delay={100}
            overlay={(
              <Tooltip id="undo-button-tooltip">
                <b>Undo</b>
                {' '}
                <kbd>
                  <kbd>Ctrl</kbd>
                  {' + '}
                  <kbd>z</kbd>
                </kbd>
                {undoDisabled && (
                  <>
                    <br />
                    <i>Unavailable</i>
                  </>
                )}
              </Tooltip>
            )}
          >
            <div className="d-inline-block rounded mr-2" role="button" tabIndex={0}>
              <Button
                variant="outline-dark"
                disabled={undoDisabled}
                onClick={() => dispatch({ type: DispatchTypes.undo })}
                className="shadow bg-white-transparent"
              >
                <i className="bi-arrow-90deg-left h4" />
              </Button>
            </div>
          </OverlayTrigger>

          {/* Redo button with tooltip. */}
          <OverlayTrigger
            placement="bottom"
            delay={100}
            overlay={(
              <Tooltip id="redo-button-tooltip">
                <b>Redo</b>
                {' '}
                <kbd>
                  <kbd>Ctrl</kbd>
                  {' + '}
                  <kbd>y</kbd>
                </kbd>
                {redoDisabled && (
                  <>
                    <br />
                    <i>Unavailable</i>
                  </>
                )}
              </Tooltip>
            )}
          >
            <div className="d-inline-block rounded" role="button" tabIndex={0}>
              <Button
                variant="outline-dark"
                disabled={redoDisabled}
                onClick={() => dispatch({ type: DispatchTypes.redo })}
                className="shadow bg-white-transparent"
              >
                <i className="bi-arrow-90deg-right h4" />
              </Button>
            </div>
          </OverlayTrigger>
        </div>
      )}

      {/* HUD Zoom slider: display if zoom is enabled for current mode. */}
      {'zoom' in state && (
        <OverlayTrigger
          placement="left"
          delay={100}
          overlay={<Tooltip id="zoom-slider-tooltip">Zoom</Tooltip>}
        >
          <div
            className="h-50 position-absolute right-middle mr-3 rounded-pill"
            role="slider"
            aria-valuenow={state.zoom}
            tabIndex={0}
          >
            <Slider
              className="h-100"
              type="zoom"
              offset={(Zoom.max - state.zoom) / (Zoom.max - Zoom.min)}
              onScroll={(offset) => dispatch(
                { type: DispatchTypes.zoom, zoom: Zoom.max - (Zoom.max - Zoom.min) * offset },
              )}
              onDragStart={
                /** @see GlobalState */
                () => dispatch({ type: DispatchTypes.globalSet, name: 'grabbing', value: true })
              }
              onDragEnd={
                /** @see GlobalState */
                () => dispatch({ type: DispatchTypes.globalSet, name: 'grabbing', value: false })
              }
            />
          </div>
        </OverlayTrigger>
      )}
    </div>
  );
}
