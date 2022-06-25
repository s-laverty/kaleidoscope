import classNames from 'classnames';
import React, { useEffect, useReducer, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import ConfirmModal from '../components/ConfirmModal';
import { Hex, Modals, Tools } from '../utils/config';
import { DispatchTypes, InitialState, reducer } from '../utils/kaleidoscope';
import DisplayArea from './DisplayArea';
import './Kaleidoscope.scss';
import LoadFileModal from './LoadFileModal';
import MainSidebar from './MainSideBar';
import SaveFileModal from './SaveFileModal';
/** @typedef {import('../utils/kaleidoscope').GlobalState} GlobalState */
/** @typedef {import('../utils/kaleidoscope').HexTessellateState} HexTessellateState */
/** @typedef {import('../utils/kaleidoscope').ModeState} ModeState */
/** @typedef {import('../utils/worker').WorkerMessage} WorkerMessage */

/** Inject stylesheet. */

const style = document.createElement('style');
document.head.appendChild(style);
style.sheet.insertRule(`.bg-hexgrid { background-image: url("${Hex.grid.backgroundImage}") }`);

/**
 * Sends a message to a worker, yielding a promise that can be awaited while it executes.
 * @template T
 * @callback SendWorkerMessage
 * @param {WorkerMessage} message - The message telling the worker what to do.
 * @returns {Promise<T>}
 */

/** Sets up an instance of a worker that communicates asynchronously via Promises. */
const useWorker = () => {
  const [sendWorkerMessage, setSendWorkerMessage] = useState(
    /** @type {() => SendWorkerMessage<*>} */ (null),
  );
  useEffect(() => {
    const worker = new Worker(new URL('../utils/worker.js', import.meta.url));
    const resolves = [];
    setSendWorkerMessage(() => (message) => new Promise((resolve) => {
      resolves.push(resolve);
      worker.postMessage(message);
    }));
    worker.onmessage = ({ data }) => resolves.shift()(data);
    return () => worker.terminate();
  }, []);
  return sendWorkerMessage;
};

/**
 * Kaleidoscope app container.
 * @returns {JSX.Element}
 */
export default function Kaleidoscope() {
  const [globalState, dispatch] = useReducer(reducer, InitialState);
  const sendWorkerMessage = useWorker();

  /** Set up global event listeners for keyboard events */
  useEffect(() => {
    /**
     * Handles a keyboard event in the global Kaleidoscope scope by calling dispatch.
     * @param {KeyboardEvent} event - The keyboard event to handle.
     */
    const handleKeyEvent = (event) => {
      /** @see GlobalState.shiftKey */
      if (event.shiftKey) dispatch({ type: DispatchTypes.globalSet, name: 'shiftKey', value: true });
      else dispatch({ type: DispatchTypes.globalSet, name: 'shiftKey', value: false });

      if (event.type === 'keydown') {
        if (event.ctrlKey) {
          switch (event.key) {
            case 'z':
              if (event.shiftKey) dispatch({ type: DispatchTypes.redo });
              else dispatch({ type: DispatchTypes.undo });
              break;
            case 'y': dispatch({ type: DispatchTypes.redo }); break;
            default: break;
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyEvent);
    window.addEventListener('keyup', handleKeyEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyEvent);
      window.removeEventListener('keydown', handleKeyEvent);
    };
  }, []);

  /**
   * Set up a watcher to handle a changing tile shape in tessellation mode.
   * @see HexTessellateState.tessellationPending
   */
  useEffect(
    () => dispatch({ type: DispatchTypes.set, name: 'tessellationPending', value: true }),
    [globalState.hexTessellate.tileShape],
  );

  const {
    shiftKey, grabbing, sidebar, modal, mode,
  } = globalState;
  /** @type {ModeState} */
  let state = globalState[globalState.mode];
  /**
   * Temporarily override the selected tool to 'pan' if the shift key is depressed and panning is
   * available in the current application mode.
   */
  if (state.pan && shiftKey && !modal) state = { ...state, tool: Tools.pan };

  return (
    <div className="Kaleidoscope">
      <Container
        fluid
        className={classNames(
          'vh-100 overflow-hidden p-0',
          { 'cursor-grabbing': grabbing },
        )}
      >
        <Row noGutters className="h-100">
          {sidebar
            && (
            <Col
              xs={12}
              sm={6}
              md={5}
              lg={4}
              xl={3}
              className="h-100 overflow-auto border-right shadow"
            >
              <MainSidebar {...{
                mode, state, dispatch, sendWorkerMessage,
              }}
              />
            </Col>
            )}
          <Col xs={1} className="flex-grow-1 mw-100 h-100">
            <DisplayArea {...{
              sidebar, mode, state, dispatch,
            }}
            />
          </Col>
        </Row>
      </Container>

      <ConfirmModal
        show={modal === Modals.clearAllConfirm}
        title="Clear All"
        onHide={
          /** @see GlobalState.modal */
          () => dispatch({ type: DispatchTypes.globalSet, name: 'modal', value: null })
        }
        onConfirm={() => dispatch({ type: DispatchTypes.clearAll })}
      >
        Are you sure you want to clear everything?
      </ConfirmModal>

      <LoadFileModal
        show={modal === Modals.loadFile}
        {...{ mode, dispatch }}
      />

      <SaveFileModal
        show={modal === Modals.saveFile}
        {...{ globalState, dispatch }}
      />
    </div>
  );
}
