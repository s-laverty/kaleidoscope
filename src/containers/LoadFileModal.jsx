import React, { useState } from 'react';
import {
  Alert, Button, Form, Modal,
} from 'react-bootstrap';
import { Names } from '../utils/config';
import { DispatchTypes, loadJSON } from '../utils/kaleidoscope';
/** @typedef {import('../utils/kaleidoscope').Dispatch} Dispatch */
/** @typedef {import('../utils/kaleidoscope').LoadResult} LoadResult */
/** @typedef {import('../utils/config').Modes} Modes */
/** @typedef {import('../utils/kaleidoscope').GlobalState} GlobalState */

/**
 * This component shows the "load file" modal.
 * @param {object} props
 * @param {Modes} props.mode - The current application mode.
 * @param {Dispatch} props.dispatch - The state reducer dispatch function.
 * @param {object} [props.rest] - All other properties passed into the ConfirmModal props.
 * @returns {JSX.Element}
 */
export default function LoadFileModal({ mode, dispatch, ...rest }) {
  const [loadState, setLoadState] = useState(/** @type {string} */ (null));
  const [loadResult, setLoadResult] = useState(/** @type {LoadResult} */ (null));

  /** @see GlobalState.modal */
  const onHide = () => dispatch({ type: DispatchTypes.globalSet, name: 'modal', value: null });
  return (
    <Modal
      backdrop="static"
      onHide={onHide}
      onEnter={() => {
        setLoadState();
        setLoadResult();
      }}
      {...rest}
    >
      <Modal.Header closeButton>
        <Modal.Title>Load Project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.File
            id="load-file-input"
            label="Choose a Kaleidoscope Project file"
            onChange={(event) => {
              const file = event.target.files[0];
              if (!file) {
                setLoadState(null);
                return;
              }
              const reader = new FileReader();
              reader.onloadend = () => {
                if (reader.error) {
                  setLoadState('error');
                  return;
                }
                let result;
                try {
                  result = loadJSON(reader.result);
                } catch (error) {
                  setLoadState('invalid');
                  return;
                }
                setLoadResult(result);
                if (result.mode !== mode) setLoadState('switch-mode');
                else setLoadState('ready');
              };
              reader.readAsText(file);
            }}
          />
        </Form.Group>
        {loadState === 'error' && (
          <Alert variant="danger">
            The app encountered an error while loading this file. Please try again or
            try loading a different file.
          </Alert>
        )}
        {loadState === 'invalid' && (
          <Alert variant="danger">
            This file is not a valid Kaleidoscope project file. Try loading a
            different file.
          </Alert>
        )}
        {loadState === 'switch-mode' && (
          <Alert variant="info">
            {'This file contains a Kaleidoscope project for '}
            <b>{Names.modes[loadResult.mode]}</b>
            {' mode. Would you like to switch to this mode?'}
            <Button
              className="d-block mx-auto mt-2"
              onClick={() => {
                /** @see GlobalState.mode */
                dispatch({ type: DispatchTypes.globalSet, name: 'mode', value: loadResult.mode });
                setLoadState('ready');
              }}
            >
              Switch mode
            </Button>
          </Alert>
        )}
        {loadState === 'ready' && (
          <Alert variant="warning">
            Warning: When you load this project, you&apos;ll lose any unsaved progress on your
            current project!
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button
          disabled={loadState !== 'ready'}
          onClick={() => {
            dispatch({ type: DispatchTypes.loadProject, state: loadResult.state });
            onHide();
          }}
        >
          Load File
        </Button>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
