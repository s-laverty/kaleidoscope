import React, { useEffect, useRef, useState } from 'react';
import {
  Button, Col, Form, InputGroup, Modal,
} from 'react-bootstrap';
import { DispatchTypes, saveJSON } from '../utils/kaleidoscope';
/** @typedef {import('../utils/kaleidoscope').Dispatch} Dispatch */
/** @typedef {import('../utils/kaleidoscope').GlobalState} GlobalState */

/**
 * This component shows the "save file" modal.
 * @param {object} props
 * @param {GlobalState} props.globalState - The current global Kaleidoscope app state.
 * @param {Dispatch} props.dispatch - The state reducer dispatch function.
 * @param {object} [props.rest] - All other properties passed into the ConfirmModal props.
 * @returns {JSX.Element}
 */
export default function SaveFileModal({ globalState, dispatch, ...rest }) {
  const [filename, setFilename] = useState('Kaleidoscope Project');
  const [fileURI, setFileURI] = useState(/** @type {string} */ (null));
  const filenameInput = useRef();
  const downloadAnchor = useRef();
  const clickDownloadAnchor = useRef(false);

  /** @see GlobalState.modal */
  const onHide = () => dispatch({ type: DispatchTypes.globalSet, name: 'modal', value: null });

  useEffect(() => {
    if (clickDownloadAnchor.current) {
      clickDownloadAnchor.current = false;
      downloadAnchor.current?.click();
      onHide();
    }
  });

  return (
    <Modal
      backdrop="static"
      onHide={onHide}
      onEnter={() => {
        setFileURI();
        filenameInput.current.focus();
        filenameInput.current.select();
      }}
      {...rest}
    >
      <a
        ref={downloadAnchor}
        href={`data:application/json,${fileURI}`}
        download={`${filename}.json`}
        className="d-none"
      >
        Download project file
      </a>
      <Form
        action=""
        onSubmit={(e) => {
          e.preventDefault();
          clickDownloadAnchor.current = true;
          setFileURI(encodeURIComponent(saveJSON(globalState)));
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Save As</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group as={Form.Row} controlId="Kaleidoscope-save-filename">
            <Form.Label column xs="auto">Filename</Form.Label>
            <Col>
              <InputGroup>
                <Form.Control
                  ref={filenameInput}
                  type="text"
                  placeholder="Project Filename"
                  required
                  value={filename}
                  onChange={(event) => setFilename(event.target.value)}
                />
                <InputGroup.Append>
                  <InputGroup.Text>.json</InputGroup.Text>
                </InputGroup.Append>
              </InputGroup>
            </Col>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button type="submit" disabled={!filename.length}>Save File</Button>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
