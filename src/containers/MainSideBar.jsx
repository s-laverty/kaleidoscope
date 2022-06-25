import classNames from 'classnames';
import React, {
  useContext, useEffect, useRef, useState,
} from 'react';
import {
  Accordion, AccordionContext, Alert, Button, Card, Col, Container, Form, Navbar, OverlayTrigger,
  Row, Spinner, Tooltip, useAccordionToggle,
} from 'react-bootstrap';
import ColorIcon from '../components/ColorIcon';
import DropTarget from '../components/DropTarget';
import {
  DragDataTransferType, Modals, Modes, Names, Tools,
} from '../utils/config';
import { DispatchTypes, HexPoint } from '../utils/kaleidoscope';
/** @typedef {import('../utils/kaleidoscope').Dispatch} Dispatch */
/** @typedef {import('../utils/kaleidoscope').GlobalState} GlobalState */
/** @typedef {import('../utils/kaleidoscope').HexFreestyleState} HexFreestyleState */
/** @typedef {import('../utils/kaleidoscope').HexSet} HexSet */
/** @typedef {import('../utils/kaleidoscope').HexTessellateState} HexTessellateState */
/** @typedef {import('../utils/kaleidoscope').ModeState} ModeState */
/** @template T @typedef {import('./Kaleidoscope').SendWorkerMessage<T>} SendWorkerMessage */

/**
 * Component for a custom accordion toggle (allows making the accordion toggle into a button).
 * @param {object} props
 * @param {string} props.eventKey - The event key for the accordion toggle.
 * @param {React.ReactChildren} props.children - Nodes rendered within the accordion.
 * @returns {JSX.Element}
 */
function CustomAccordionToggle({ eventKey, children }) {
  const currentEventKey = useContext(AccordionContext);
  const toggle = useAccordionToggle(eventKey);
  return (
    <Button
      block
      variant="outline-primary"
      className="shadow-none"
      onClick={toggle}
      active={currentEventKey === eventKey}
    >
      {children}
    </Button>
  );
}

/**
 * Component for displaying the tessellation mode's selected tessellation.
 * @param {object} props
 * @param {HexTessellateState} props.state - The current application state.
 * @param {Dispatch} props.dispatch - The current application dispatch.
 * @param {SendWorkerMessage<*>} props.sendWorkerMessage - Promise-driven web worker communication
 * @returns {JSX.Element}
 */
function TessellationCard({
  state: {
    tool, tileShape, tessellations, tessellationPending, tessellationIndex,
  }, dispatch, sendWorkerMessage,
}) {
  /** Cancel loading tessellations when this component is cleared. */
  const isCancelled = useRef(false);
  useEffect(() => () => { isCancelled.current = true; }, []);

  /** Keep track of the most recently sent tile shape (prevents sending many identical requests). */
  const [sentTileShape, setSentTileShape] = useState(/** @type {HexSet} */(null));

  /** Load tessellations if they aren't already loaded or requested for this tile shape. */
  const loadTessellations = async () => {
    setSentTileShape(tileShape);
    /** @type {[[number, number], [number, number]][]} */
    const newTessellations = await sendWorkerMessage({ type: 'tessellate', tileShape: tileShape.values() });
    if (isCancelled.current) return;
    dispatch({
      type: DispatchTypes.tessellationLoad,
      tileShape,
      tessellations: newTessellations
        .map((tessellation) => tessellation.map((point) => new HexPoint(...point))),
    });
  };
  useEffect(() => {
    if (
      ![Tools.tileShape, Tools.tileSwap].includes(tool)
      && tessellationPending
      && tileShape
      && tileShape !== sentTileShape
    ) {
      loadTessellations();
    }
  });

  /** @type {JSX.Element} The content to display in the tessellation card. */
  let cardBody;

  if ([Tools.tileShape, Tools.tileSwap].includes(tool)) {
    /** Display a confirm button to confirm the shape before loading tessellations. */
    cardBody = (
      <Button
        variant="success d-block mx-auto"
        onClick={
          /** @see HexTessellateState.tool */
          () => dispatch({ type: DispatchTypes.set, name: 'tool', value: null })
        }
      >
        <i className="bi-check-lg" />
        {' Confirm Shape'}
      </Button>
    );
  } else if (tessellationPending) {
    /** Display a loading spinner while the tessellation loads asynchronously. */
    cardBody = (<Spinner animation="border" variant="primary" className="d-block mx-auto" />);
  } else if (tessellations?.length) {
    /** Prompt the user to select a tessellation. */
    cardBody = (
      <>
        <h5>Choose a tessellation</h5>
        <Form.Group>
          {tessellations.map((tessellation, i) => (
            <Form.Check
              key={tessellation}
              type="radio"
              name="tessellation-index"
              checked={i === tessellationIndex}
              onChange={
                /** @see HexTessellateState.tessellationIndex */
                () => dispatch({ type: DispatchTypes.set, name: 'tessellationIndex', value: i })
              }
              label={`${i + 1}: ${tessellation.map((x) => `[${x}]`).join(', ')}`}
            />
          ))}
        </Form.Group>
      </>
    );
  } else {
    /** Notify the user that there are no valid tessellations for their chosen shape. */
    cardBody = <> No tessellations for this shape </>;
  }

  return (
    <Card.Body>
      {cardBody}
    </Card.Body>
  );
}

/**
 * Component for displaying the available color palette.
 * @param {object} props
 * @param {ModeState} props.state - The current application state.
 * @param {Dispatch} props.dispatch - The current application dispatch.
 * @returns {JSX.Element}
 */
function ColorCard({ state: { colors, colorIndex }, dispatch }) {
  const [dragging, setDragging] = useState(false);
  const [editIndex, setEditIndex] = useState(/** @type {number} */(null));

  /** Color picker input */
  const colorPicker = useRef(/** @type {HTMLInputElement} */(null));
  /**
   * Specifies whether the color picker input should be clicked on (to initiate selecting a color).
  */
  const clickColorPicker = useRef(false);

  /**
   * When the color picker window is closed, call the dispatch function to confirm the color change
   * and add possibly add the color change to the edit history.
   */
  useEffect(() => {
    const input = colorPicker.current;
    const callback = () => dispatch({ type: DispatchTypes.colorChangeDismiss });
    input.addEventListener('change', callback);
    return () => input.removeEventListener('change', callback);
  }, [dispatch]);

  /** Click the color picker if clickColorPicker.current is true */
  useEffect(() => {
    if (clickColorPicker.current) {
      clickColorPicker.current = false;
      colorPicker.current.click();
    }
  });

  /** @type {React.DragEventHandler} */
  const checkDrop = (event) => {
    if (dragging && event.dataTransfer.types.includes(DragDataTransferType)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    }
  };

  return (
    <Card.Body>
      <Row noGutters>
        {colors.map((color, i) => (
          <Col xs={2} key={color}>
            <DropTarget
              as={Button}
              modifier="active"
              size="lg"
              variant="outline-primary"
              className={classNames('shadow-none d-block mx-auto p-1 rounded-circle', {
                'border-white': i !== colorIndex,
              })}
              onClick={() => dispatch({ type: DispatchTypes.colorSelect, index: i })}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData(DragDataTransferType, '');
                setDragging(true);
                setEditIndex(i);
              }}
              onDragEnd={() => setDragging(false)}
              onDragEnter={checkDrop}
              onDragOver={checkDrop}
              onDrop={(event) => {
                event.preventDefault();
                if (editIndex !== i) {
                  dispatch({ type: DispatchTypes.colorSwap, colorIndices: [editIndex, i] });
                }
                setDragging(false);
              }}
            >
              <ColorIcon {...{ color }} />
            </DropTarget>
          </Col>
        ))}
      </Row>
      <Form.Row className="mt-2">
        <Col>
          <DropTarget
            as={Button}
            modifier="active"
            block
            disabled={!dragging && colorIndex === null}
            onClick={() => {
              if (editIndex !== null) {
                clickColorPicker.current = true;
                setEditIndex(null);
              } else colorPicker.current.click();
            }}
            onDragEnter={checkDrop}
            onDragOver={checkDrop}
            onDrop={(event) => {
              event.preventDefault();
              colorPicker.current.click();
            }}
          >
            <i className="bi-sliders" />
            {' Edit'}
            <input
              type="color"
              ref={colorPicker}
              value={colors[editIndex ?? colorIndex] ?? ''}
              className="d-none"
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => dispatch({
                type: DispatchTypes.colorChange,
                color: event.target.value,
                index: editIndex ?? colorIndex,
              })}
            />
          </DropTarget>
        </Col>
        <Col>
          <DropTarget
            as={Button}
            modifier="active"
            block
            variant="danger"
            disabled={!dragging && colorIndex === null}
            onClick={() => dispatch({ type: DispatchTypes.colorRemove })}
            onDragEnter={checkDrop}
            onDragOver={checkDrop}
            onDrop={(e) => {
              e.preventDefault();
              dispatch({ type: DispatchTypes.colorRemove, index: editIndex });
            }}
          >
            <i className="bi-dash-circle" />
            {' Remove'}
          </DropTarget>
        </Col>
      </Form.Row>
      <hr />
      <Button
        className="mt-2 d-block mx-auto"
        onClick={() => {
          clickColorPicker.current = true;
          dispatch({ type: DispatchTypes.colorAdd });
        }}
      >
        <i className="bi-plus-circle" />
        {' New Color'}
      </Button>
    </Card.Body>
  );
}

/**
 * Component for displaying a tool button.
 * @param {object} props - All unaddressed props will be passed into the button.
 * @param {React.ReactChildren} props.children - Children components to display inside the button.
 * @param {Tooltip} [props.tooltip] - An optional tooltip to display when hovering over the button.
 * @param {string} [props.variant] - The outline variant for the button.
 * @returns {JSX.Element}
 */
function ToolButton({
  children, variant = 'primary', tooltip, ...other
}) {
  let button = (
    <Button block variant={`outline-${variant}`} className="h-100" {...other}>
      {children}
    </Button>
  );

  /** If there is a tooltip for the button, then wrap the button in an OverlayTrigger. */
  if (tooltip) {
    button = (
      <OverlayTrigger placement="top" delay={100} overlay={tooltip}>
        <div className="rounded h-100" role="button" tabIndex={0}>
          {button}
        </div>
      </OverlayTrigger>
    );
  }

  return (
    <Col xs={4} className="mt-2">
      {button}
    </Col>
  );
}

/**
 * Main sidebar component, visible on left side of screen.
 * @param {object} props
 * @param {string} props.mode - The current application mode.
 * @param {ModeState} props.state - The current application state.
 * @param {Dispatch} props.dispatch - The current application dispatch.
 * @param {SendWorkerMessage<*>} props.sendWorkerMessage - Promise-driven web worker communication
 * channel.
 * @returns {JSX.Element}
 */
export default function MainSideBar({
  mode, state, dispatch, sendWorkerMessage,
}) {
  return (
    <>
      {/* Title bar with application name. */}
      <Navbar bg="dark" variant="dark" className="sticky-top">
        <Navbar.Brand className="mr-auto">Kaleidoscope</Navbar.Brand>
        <Button
          variant="outline-light"
          className="shadow"
          onClick={
            /** @see GlobalState.sidebar */
            () => dispatch({ type: DispatchTypes.globalSet, name: 'sidebar', value: false })
          }
        >
          <i className="bi-chevron-double-left h4" />
        </Button>
      </Navbar>

      {/* Global UI (mode selection, file save / load interface). */}
      <Container fluid className="py-3">
        {/* Mode selection dropdown */}
        <Form.Group as={Form.Row} controlId="Kaleidoscope-mode-select">
          <Form.Label column xs="auto">Mode</Form.Label>
          <Col>
            <Form.Control
              as="select"
              value={mode}
              onChange={
                /** @see GlobalState.mode */
                (event) => dispatch({ type: DispatchTypes.globalSet, name: 'mode', value: event.target.value })
              }
            >
              {
                Object.values(Modes)
                  .map((key) => <option key={key} value={key}>{Names.modes[key]}</option>)
              }
            </Form.Control>
          </Col>
        </Form.Group>

        {/* File load & save buttons. */}
        <Form.Group as={Form.Row}>
          <Col>
            <Button
              block
              onClick={
                /** @see GlobalState.modal */
                () => dispatch({ type: DispatchTypes.globalSet, name: 'modal', value: Modals.loadFile })
              }
            >
              <i className="bi-folder" />
              {' Load File'}
            </Button>
          </Col>
          <Col>
            <Button
              block
              variant="success"
              onClick={
                /** @see GlobalState.modal */
                () => dispatch({ type: DispatchTypes.globalSet, name: 'modal', value: Modals.saveFile })
              }
            >
              <i className="bi-save" />
              {' Save'}
            </Button>
          </Col>
        </Form.Group>

        {/* Collapsible menus (accordion). */}
        <Accordion>
          {/* Options accordion menu. */}
          {[Modes.hexTessellate, Modes.hexFreestyle].includes(mode) && (
            <Card>
              <CustomAccordionToggle eventKey="options">
                <i className="bi-toggles" />
                {' Options'}
              </CustomAccordionToggle>
              <Accordion.Collapse eventKey="options">
                <Card.Body>
                  {mode === Modes.hexTessellate && (
                    <Form.Check
                      type="switch"
                      label="Show outline"
                      id="hexTessellate-show-outline-switch"
                      checked={state.tool !== Tools.tileShape && state.showOutline}
                      disabled={state.tool === Tools.tileShape}
                      onChange={
                        /** @see HexTessellateState.showOutline */
                        () => dispatch({ type: DispatchTypes.toggle, name: 'showOutline' })
                      }
                    />
                  )}
                  {mode === Modes.hexFreestyle && (
                    <Form.Check
                      type="switch"
                      label="Show empty hexes"
                      id="hexFreestyle-show-empty-hexes-switch"
                      checked={state.showEmpty}
                      onChange={
                        /** @see HexFreestyleState.showEmpty */
                        () => dispatch({ type: DispatchTypes.toggle, name: 'showEmpty' })
                      }
                    />
                  )}
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          )}

          {/* Tessellation selection accordion menu. */}
          {mode === Modes.hexTessellate && (
            <Card>
              <CustomAccordionToggle eventKey="tessellate">
                <i className="bi-snow3" />
                {' Tessellate'}
              </CustomAccordionToggle>
              <Accordion.Collapse eventKey="tessellate">
                <TessellationCard {...{ state, dispatch, sendWorkerMessage }} />
              </Accordion.Collapse>
            </Card>
          )}

          {/* Color selection accordion menu. */}
          {[Modes.hexTessellate, Modes.hexFreestyle].includes(mode) && (
            <Card>
              <CustomAccordionToggle eventKey="color">
                <i className="bi-palette" />
                {' Color - '}
                {(state.colorIndex !== null) ? (
                  <ColorIcon
                    className="d-inline-block"
                    color={state.colors[state.colorIndex]}
                  />
                ) : 'None'}
              </CustomAccordionToggle>
              <Accordion.Collapse eventKey="color">
                <ColorCard {...{ state, dispatch }} />
              </Accordion.Collapse>
            </Card>
          )}
        </Accordion>

        {/* Tool selection area. */}
        <h5 className="mt-3">Select Tool</h5>
        <Form.Row>
          {/* Hex tessellation mode unique tools. */}
          {mode === Modes.hexTessellate && (
            <>
              {/* Change tile shape tool. */}
              <ToolButton
                active={state.tool === Tools.tileShape}
                onClick={
                  /** @see HexTessellateState.tool */
                  () => dispatch({ type: DispatchTypes.setToggle, name: 'tool', value: Tools.tileShape })
                }
              >
                <i className="bi-hexagon-half" />
                <br />
                Change Tile Shape
              </ToolButton>

              {/* Hex swapping tool. */}
              <ToolButton
                disabled={state.tool === Tools.tileShape || state.tessellationIndex === null}
                active={state.tool === Tools.tileSwap}
                onClick={
                  /** @see HexTessellateState.tool */
                  () => dispatch({ type: DispatchTypes.setToggle, name: 'tool', value: Tools.tileSwap })
                }
              >
                <i className="bi-arrow-left-right" />
                <br />
                Swap Hexes
              </ToolButton>
            </>
          )}

          {/* Hex freestyle mode unique tools. */}
          {mode === Modes.hexFreestyle && (
            /** Panning tool. */
            <ToolButton
              active={state.tool === Tools.pan}
              onClick={
                /** @see HexFreestyleState.tool */
                () => dispatch({ type: DispatchTypes.setToggle, name: 'tool', value: Tools.pan })
              }
              tooltip={(
                <Tooltip id="pan-button-tooltip">
                  {'Hold down '}
                  <kbd>Shift</kbd>
                  {' to temporarily enable panning.'}
                </Tooltip>
              )}
            >
              <i className="bi-arrows-move h5" />
              <br />
              Pan
            </ToolButton>
          )}

          {/* Hex tessellation and hex freestyle shared tools. */}
          {[Modes.hexTessellate, Modes.hexFreestyle].includes(mode) && (
            <>
              {/* Fill color tool. */}
              <ToolButton
                disabled={state.colorIndex === null}
                active={state.tool === Tools.colorFill}
                onClick={
                  /** @see HexFreestyleState.tool @see HexTessellateState.tool */
                  () => dispatch({ type: DispatchTypes.setToggle, name: 'tool', value: Tools.colorFill })
                }
                tooltip={(
                  <Tooltip id="colorFillButtonTooltip">
                    {state.colorIndex === null ? (
                      <>
                        {'You must first '}
                        <i>choose a color</i>
                        {' before you can use '}
                        <b>Fill Color</b>
                        .
                      </>
                    ) : (
                      <>
                        <i>Click and drag</i>
                        {' to fill multiple hexes in a row.'}
                      </>
                    )}
                  </Tooltip>
                )}
              >
                <i className="bi-brush h5" />
                <br />
                Fill Color
              </ToolButton>

              {/* Flood color tool. */}
              <ToolButton
                disabled={state.colorIndex === null}
                active={state.tool === Tools.colorFlood}
                onClick={
                  /** @see HexFreestyleState.tool @see HexTessellateState.tool */
                  () => dispatch({ type: DispatchTypes.setToggle, name: 'tool', value: Tools.colorFlood })
                }
                tooltip={(
                  <Tooltip id="colorFloodButtonTooltip">
                    {state.colorIndex === null ? (
                      <>
                        {'You must first '}
                        <i>choose a color</i>
                        {' before you can use '}
                        <b>Paint Bucket</b>
                        .
                      </>
                    ) : (
                      <>
                        Replace all connected hexes of a given color with the new color.
                      </>
                    )}
                  </Tooltip>
                )}
              >
                <i className="bi-paint-bucket h5" />
                <br />
                Paint Bucket
              </ToolButton>
            </>
          )}

          {/* Clear color tool */}
          {mode === Modes.hexFreestyle && (
            <ToolButton
              variant="danger"
              active={state.tool === Tools.colorClear}
              onClick={
                /** @see HexFreestyleState.tool @see HexTessellateState.tool */
                () => dispatch({ type: DispatchTypes.setToggle, name: 'tool', value: Tools.colorClear })
              }
              tooltip={(
                <Tooltip id="colorClearButtonTooltip">
                  <i>Click and drag</i>
                  {' to clear multiple hexes in a row.'}
                </Tooltip>
              )}
            >
              <i className="bi-x-square h5" />
              <br />
              Clear Color
            </ToolButton>
          )}

          {/* Eyedropper tool. */}
          {[Modes.hexTessellate, Modes.hexFreestyle].includes(mode) && (
            <ToolButton
              active={state.tool === Tools.colorEyedropper}
              onClick={
                /** @see HexFreestyleState.tool @see HexTessellateState.tool */
                () => dispatch({ type: DispatchTypes.setToggle, name: 'tool', value: Tools.colorEyedropper })
              }
            >
              <i className="bi-eyedropper" />
              <br />
              Eye
              <wbr />
              dropper
            </ToolButton>
          )}

          {/* Clear all tool. */}
          {mode === Modes.hexFreestyle && (
            <ToolButton
              variant="danger"
              onClick={() => {
                /** @see GlobalState.modal */
                dispatch({ type: DispatchTypes.globalSet, name: 'modal', value: Modals.clearAllConfirm });
              }}
            >
              <i className="bi-trash h5" />
              <br />
              Clear All
            </ToolButton>
          )}
        </Form.Row>

        {/* Tips. */}
        {mode === Modes.hexFreestyle && (
          <Alert variant="info" className="mt-3">
            <i className="bi-info-circle" />
            {' Tip: Double-click a hex to clear it'}
          </Alert>
        )}
      </Container>
    </>
  );
}
