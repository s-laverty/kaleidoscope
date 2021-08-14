import { useContext, useEffect, useRef, useState } from 'react';
import ColorIcon from '../components/ColorIcon';
import {
  Accordion, AccordionContext, Alert, Button, Card, Col, Container, Form,
  Navbar, OverlayTrigger, Row, Spinner, Tooltip, useAccordionToggle
} from 'react-bootstrap';
import { MODES } from '../utils/KaleidoscopeUtils';
import DropTarget from '../components/DropTarget';

const CustomAccordionToggle = ({ eventKey, children }) => {
  const current_eventKey = useContext(AccordionContext);
  const toggle = useAccordionToggle(eventKey);
  return (
    <Button block variant='outline-primary' className='shadow-none'
      onClick={toggle} active={current_eventKey === eventKey}>
      {children}
    </Button>
  )
};

const TessellationCard = ({ tool, tiledata, tile_shape_signature, tessellations,
  tessellation_index, tessellation_signature, dispatch, postMessage }) => {
  const [loadSignature, setLoadSignature] = useState();
  const [preserveTessellation, setPreserveTessellation] = useState();
  const isCancelled = useRef(false);

  useEffect(() => () => isCancelled.current = true, []);

  useEffect(() => {
    const load = async () => {
      setLoadSignature(tile_shape_signature);
      if (!preserveTessellation) {
        dispatch({ type: 'set-current', name: 'tessellations', value: null });
        dispatch({ type: 'set-current', name: 'tessellation_index', value: null });
      }
      let tessellations = await postMessage({ type: 'tessellate', tiledata: [...tiledata.keys()] });
      if (isCancelled.current) return;
      dispatch({
        type: 'load-tessellations',
        tessellations,
        signature: tile_shape_signature
      });
      setLoadSignature(prev => prev === tile_shape_signature ? null : prev);
    };
    if (!['tile-shape', 'tile-swap'].includes(tool) &&
      tessellation_signature !== tile_shape_signature &&
      loadSignature !== tile_shape_signature) load();
  });

  useEffect(() => {
    setPreserveTessellation(tool === 'tile-swap');
  }, [tool]);

  return (
    <Card.Body>
      {['tile-shape', 'tile-swap'].includes(tool) ?
        <Button variant='success d-block mx-auto'
          onClick={() => dispatch({ type: 'select-tool', tool: null })}>
          <i className='bi-check2-square' /> Confirm Shape
        </Button>
        : tessellation_signature === tile_shape_signature ?
          tessellations.length ? <>
            <h5>Choose a tessellation</h5>
            <Form.Group>
              {tessellations.map((tessellation, i) => {
                let checked = i === tessellation_index;
                return (
                  <Form.Check key={i} type='radio' name='tessellation-index'
                    checked={checked} onChange={() =>
                      dispatch({ type: 'set-current', name: 'tessellation_index', value: i })}
                    label={`${i + 1}: ${tessellation.map(x => `[${x}]`).join(', ')}`} />
                );
              })}
            </Form.Group>
          </> : <>No tessellations for this shape</>
          : <Spinner animation='border' variant='primary' className='d-block mx-auto' />}
    </Card.Body>
  );
};

const ColorCard = ({ colors, color_index, dispatch }) => {
  const [dragging, setDragging] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const color_picker = useRef();
  const click_color_picker = useRef(false);

  useEffect(() => {
    let input = color_picker.current;
    let callback = () => dispatch({ type: 'change-color-dismiss' });
    input.addEventListener('change', callback);
    return () => input.removeEventListener('change', callback);
  }, [dispatch]);

  useEffect(() => {
    if (click_color_picker.current) {
      click_color_picker.current = false;
      color_picker.current.click();
    }
  });

  let checkDrop = e => {
    if (dragging && e.dataTransfer.types.includes('application/x-kaleidoscope-color')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  return (
    <Card.Body>
      <Row noGutters>
        {
          colors.map((color, i) => {
            let button_className = 'shadow-none d-block mx-auto p-1 rounded-circle';
            if (i !== color_index) button_className += ' border-white';
            return (
              <Col xs={2} key={i}>
                <DropTarget as={Button} modifier='active' size='lg' variant='outline-primary'
                  className={button_className}
                  onClick={() => dispatch({ type: 'select-color', color_index: i })}
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('application/x-kaleidoscope-color', '');
                    setDragging(true);
                    setEditIndex(i);
                  }}
                  onDragEnd={() => setDragging(false)}
                  onDragEnter={checkDrop}
                  onDragOver={checkDrop}
                  onDrop={e => {
                    e.preventDefault();
                    if (editIndex !== i) dispatch({ type: 'swap-colors', color_indices: [editIndex, i] });
                    setDragging(false);
                  }}
                >
                  <ColorIcon color={color} />
                </DropTarget>
              </Col>
            );
          })
        }
      </Row>
      <Form.Row className='mt-2'>
        <Col>
          <DropTarget as={Button} modifier='active' block
            disabled={!dragging && color_index === null}
            onClick={() => {
              if (editIndex !== null) {
                click_color_picker.current = true;
                setEditIndex(null);
              } else color_picker.current.click();
            }}
            onDragEnter={checkDrop}
            onDragOver={checkDrop}
            onDrop={e => {
              e.preventDefault();
              color_picker.current.click();
            }}>
            <i className='bi-sliders' /> Edit
            <input type='color' ref={color_picker}
              value={colors[editIndex ?? color_index] ?? ''}
              className='d-none' onClick={e => e.stopPropagation()}
              onChange={e => dispatch({
                type: 'change-color',
                color: e.target.value,
                color_index: editIndex
              })}
            />
          </DropTarget>
        </Col>
        <Col>
          <DropTarget as={Button} modifier='active' block variant='danger'
            disabled={!dragging && color_index === null}
            onClick={() => dispatch({ type: 'remove-color' })}
            onDragEnter={checkDrop}
            onDragOver={checkDrop}
            onDrop={e => {
              e.preventDefault();
              dispatch({ type: 'remove-color', color_index: editIndex });
            }}>
            <i className='bi-dash-circle' /> Remove
          </DropTarget>
        </Col>
      </Form.Row>
      <hr />
      <Button className='mt-2 d-block mx-auto'
        onClick={() => {
          click_color_picker.current = true;
          dispatch({ type: 'add-color' });
        }}>
        <i className='bi-plus-circle' /> New Color
      </Button>
    </Card.Body>
  );
};

const ToolButton = ({ children, variant = 'primary', tooltip, ...other }) => {
  variant = 'outline-' + variant;
  let inner = (<Button block variant={variant} className='h-100' {...other}>
    {children}
  </Button>);
  let outer = tooltip ? <OverlayTrigger placement='top' delay={100} overlay={tooltip}>
    <div className='rounded h-100' tabIndex={0}>
      {inner}
    </div>
  </OverlayTrigger> : inner;
  return (
    <Col xs={4} className='mt-2'>
      {outer}
    </Col>
  );
};

const MainSideBar = ({ mode, current, dispatch, postMessage }) => (<>
  <Navbar bg='dark' variant='dark' className='sticky-top'>
    <Navbar.Brand className='mr-auto'>Kaleidoscope</Navbar.Brand>
    <Button variant='outline-light' className='shadow'
      onClick={() => dispatch({ type: 'set', name: 'sidebar', value: false })}>
      <i className='bi-chevron-double-left h4' />
    </Button>
  </Navbar>
  <Container fluid className='py-3'>
    <Form.Group as={Form.Row} controlId='Kaleidoscope-mode-select'>
      <Form.Label column xs='auto'>Mode</Form.Label>
      <Col>
        <Form.Control as='select' value={mode}
          onChange={e => dispatch({ type: 'set', name: 'mode', value: e.target.value })}>
          {Object.entries(MODES).map(([mode, name]) =>
            <option key={mode} value={mode}>{name}</option>)}
        </Form.Control>
      </Col>
    </Form.Group>
    <Form.Group as={Form.Row}>
      <Col>
        <Button block
          onClick={() => dispatch({ type: 'set', name: 'modal', value: 'load-file' })}>
          <i className='bi-folder' /> Load File
        </Button>
      </Col>
      <Col>
        <Button block variant='success'
          onClick={() => dispatch({ type: 'set', name: 'modal', value: 'save-file' })}>
          <i className='bi-save' /> Save
        </Button>
      </Col>
    </Form.Group>
    <Accordion>
      {['hex-tessellate', 'hex-freestyle'].includes(mode) &&
        <Card>
          <CustomAccordionToggle eventKey='options'>
            <i className='bi-toggles' /> Options
          </CustomAccordionToggle>
          <Accordion.Collapse eventKey='options'>
            <Card.Body>
              {mode === 'hex-tessellate' && <>
                <Form.Check type='switch' label='Show outline'
                  id='hex-tessellate-show-outline-switch'
                  checked={current.tool !== 'tile-shape' && current.show_outline}
                  disabled={current.tool === 'tile-shape'}
                  onChange={() => dispatch({ type: 'toggle-current', name: 'show_outline' })}
                />
              </>}
              {mode === 'hex-freestyle' &&
                <Form.Check type='switch' label='Show empty hexes'
                  id='hex-freestyle-show-empty-hexes-switch'
                  checked={current.show_empty}
                  onChange={() => dispatch({ type: 'toggle-current', name: 'show_empty' })}
                />
              }
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      }
      {mode === 'hex-tessellate' &&
        <Card>
          <CustomAccordionToggle eventKey='tessellate'>
            <i className='bi-snow3' /> Tessellate
          </CustomAccordionToggle>
          <Accordion.Collapse eventKey='tessellate'>
            <TessellationCard {...current} dispatch={dispatch} postMessage={postMessage} />
          </Accordion.Collapse>
        </Card>
      }
      {['hex-tessellate', 'hex-freestyle'].includes(mode) &&
        <Card>
          <CustomAccordionToggle eventKey='color'>
            <i className='bi-palette' /> Color -{' '}
            {(current.color_index !== null)
              ? <ColorIcon className='d-inline-block'
                color={current.colors[current.color_index]} />
              : 'None'
            }
          </CustomAccordionToggle>
          <Accordion.Collapse eventKey='color'>
            <ColorCard {...current} dispatch={dispatch} />
          </Accordion.Collapse>
        </Card>
      }
    </Accordion>
    <h5 className='mt-3'>Select Tool</h5>
    <Form.Row>
      {mode === 'hex-tessellate' && <>
        <ToolButton active={current.tool === 'tile-shape'}
          onClick={() => dispatch({ type: 'select-tool', tool: 'tile-shape' })}>
          <i className='bi-hexagon-half' /><br />
          Change Tile Shape
        </ToolButton>
        {<ToolButton disabled={current.tool === 'tile-shape' || current.tessellation_index === null}
          active={current.tool === 'tile-swap'}
          onClick={() => dispatch({ type: 'select-tool', tool: 'tile-swap' })}>
          <i className='bi-arrow-left-right' /><br />
          Swap Hexes
        </ToolButton>}
      </>}
      {mode === 'hex-freestyle' &&
        <ToolButton active={current.tool === 'pan'}
          onClick={() => dispatch({ type: 'select-tool', tool: 'pan' })}
          tooltip={<Tooltip id='pan-button-tooltip'>
            Hold down <kbd>Shift</kbd> to temporarily
            enable panning.
          </Tooltip>}>
          <i className='bi-arrows-move h5' /><br />
          Pan
        </ToolButton>
      }
      {['hex-tessellate', 'hex-freestyle'].includes(mode) && <>
        <ToolButton disabled={current.color_index === null}
          active={current.tool === 'fill-color'}
          onClick={() => dispatch({ type: 'select-tool', tool: 'fill-color' })}
          tooltip={<Tooltip id={'fill-color-button-tooltip'}>
            {current.color_index === null ? <>
              You must first <i>choose a color</i> before you can use <b>Fill Color</b>.
            </> : <>
              <i>Click and drag</i> to fill multiple hexes in a row.
            </>}
          </Tooltip>}>
          <i className='bi-brush h5' /><br />
          Fill Color
        </ToolButton>
        <ToolButton disabled={current.color_index === null}
          active={current.tool === 'flood-color'}
          onClick={() => dispatch({ type: 'select-tool', tool: 'flood-color' })}
          tooltip={<Tooltip id={'fill-color-button-tooltip'}>
            {current.color_index === null ? <>
              You must first <i>choose a color</i> before you can use <b>Paint Bucket</b>.
            </> : <>
              Replace all connected hexes of a given color with the new color.
            </>}
          </Tooltip>}>
          <i className='bi-paint-bucket h5' /><br />
          Paint Bucket
        </ToolButton>
      </>}
      {mode === 'hex-freestyle' &&
        <ToolButton variant='danger' active={current.tool === 'clear-color'}
          onClick={() => dispatch({ type: 'select-tool', tool: 'clear-color' })}
          tooltip={<Tooltip id={'clear-color-button-tooltip'}>
            <i>Click and drag</i> to clear multiple hexes in a row.
          </Tooltip>}>
          <i className='bi-x-square h5' /><br />
          Clear Color
        </ToolButton>
      }
      {['hex-tessellate', 'hex-freestyle'].includes(mode) &&
        <ToolButton active={current.tool === 'eyedropper-color'}
          onClick={() => dispatch({ type: 'select-tool', tool: 'eyedropper-color' })}>
          <i className='bi-eyedropper' /><br />
          Eye<wbr />dropper
        </ToolButton>
      }
      {mode === 'hex-freestyle' &&
        <ToolButton variant='danger' onClick={() => {
          dispatch({ type: 'select-tool', tool: null });
          dispatch({ type: 'set', name: 'modal', value: 'clear-all-confirm' });
        }}>
          <i className='bi-trash h5' /><br />
          Clear All
        </ToolButton>
      }
    </Form.Row>
    {mode === 'hex-freestyle' &&
      <Alert variant='info' className='mt-3'>
        <i className='bi-info-circle' /> Tip: Double-click a hex to clear it
      </Alert>
    }
  </Container>
</>);

export default MainSideBar;
