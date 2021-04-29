import { useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { loadJSON, MODES } from '../utils/KaleidoscopeUtils';

const LoadFileModal = ({mode, current, dispatch, ...other}) => {
  const [loadState, setLoadState] = useState();
  const [loadResult, setLoadResult] = useState();

  const onHide = () => dispatch({type: 'set', name: 'modal', value: null});
  return (
    <Modal backdrop='static' onHide={onHide} onEnter={() => {
      setLoadState(); setLoadResult();
    }} {...other}>
      <Modal.Header closeButton>
        <Modal.Title>Load Project</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group>
          <Form.File id='load-file-input' label='Choose a Kaleidoscope Project file'
          onChange={e => {
            let file = e.target.files[0];
            if (!file) {
              setLoadState(null);
              return;
            }
            let reader = new FileReader();
            reader.onloadend = () => {
              if (reader.error) {
                setLoadState('error');
                return;
              }
              let loadResult = loadJSON(reader.result);
              if (!loadResult) {
                setLoadState('invalid');
                return;
              }
              setLoadResult(loadResult);
              if (loadResult.mode !== mode) setLoadState('switch-mode');
              else setLoadState('ready');
            };
            reader.readAsText(file);
          }}/>
        </Form.Group>
        {loadState === 'error' &&
          <Alert variant='danger'>
            The app encountered an error while loading this file. Please try again or
            try loading a different file.
          </Alert>
        }
        {loadState === 'invalid' &&
          <Alert variant='danger'>
            This file is not a valid Kaleidoscope project file. Try loading a
            different file.
          </Alert>
        }
        {loadState === 'switch-mode' &&
          <Alert variant='info'>
            This file contains a Kaleidoscope project for <b>{MODES[loadResult.mode]}</b> mode.
            Would you like to switch to this mode?
            <Button className='d-block mx-auto mt-2' onClick={() => {
              dispatch({type: 'set', name: 'mode', value: loadResult.mode});
              setLoadState('ready');
            }}>Switch mode</Button>
          </Alert>
        }
        {loadState === 'ready' &&
          <Alert variant='warning'>
            Warning: When you load this project, you'll lose any unsaved progress on your current
            project!
          </Alert>
        }
      </Modal.Body>
      <Modal.Footer>
        <Button disabled={loadState !== 'ready'} onClick={() => {
          dispatch({type: 'load-project', data: loadResult.data})
          onHide();
        }}>Load File</Button>
        <Button variant='secondary' onClick={onHide}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LoadFileModal;
