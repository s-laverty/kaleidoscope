import { useEffect, useRef, useState } from 'react';
import { Button, Col, Form, InputGroup, Modal } from 'react-bootstrap';
import { saveJSON } from '../utils/KaleidoscopeUtils';

const SaveFileModal = ({mode, current, dispatch, ...other}) => {
  const [filename, setFilename] = useState('Kaleidoscope Project');
  const [fileURI, setFileURI] = useState();
  const filename_input = useRef();
  const download_anchor = useRef();
  const click_download_anchor = useRef(false);

  const onHide = () => dispatch({type: 'set', name: 'modal', value: null});

  useEffect(() => {
    if (click_download_anchor.current) {
      click_download_anchor.current = false;
      download_anchor.current?.click();
      onHide();
    }
  });

  return (
    <Modal backdrop='static' onHide={onHide} onEnter={() => {
      setFileURI();
      filename_input.current.focus(); filename_input.current.select();
    }} {...other}>
      <a ref={download_anchor} href={'data:application/json,' + fileURI}
      download={filename + '.json'} className='d-none'>Download project file</a>
      <Form action='' onSubmit={e => {
        e.preventDefault();
        click_download_anchor.current = true;
        setFileURI(encodeURIComponent(saveJSON(mode, current)));
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Save As</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form.Group as={Form.Row} controlId='Kaleidoscope-save-filename'>
              <Form.Label column xs='auto'>Filename</Form.Label>
              <Col>
                <InputGroup>
                  <Form.Control ref={filename_input} type='text' placeholder='Project Filename'
                  required value={filename} onChange={e => setFilename(e.target.value)}/>
                  <InputGroup.Append>
                    <InputGroup.Text>.json</InputGroup.Text>
                  </InputGroup.Append>
                </InputGroup>
              </Col>
            </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button type='submit' disabled={!filename.length}>Save File</Button>
          <Button variant='secondary' onClick={onHide}>
            Cancel
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SaveFileModal;
