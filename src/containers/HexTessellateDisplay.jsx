import classNames from 'classnames';
import {
  ceil, divide, floor, inv, max, min, multiply,
} from 'mathjs';
import React, {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Hexagon, { getHexRangeInRect } from '../components/Hexagon';
import HexTile from '../components/HexTile';
import HexTileOutline from '../components/HexTileOutline';
import { Hex, Tools } from '../utils/config';
import {
  DispatchTypes, getSwaps, HexPoint, PointSet,
} from '../utils/kaleidoscope';
import './HexTessellateDisplay.scss';
/**
 * @template {React.SyntheticEvent} E
 * @typedef {import('../components/Hexagon').BoundEventHandler<E>} BoundEventHandler
 */
/** @typedef {import('../utils/kaleidoscope').HexTessellateState} HexTessellateState */
/** @typedef {import('../utils/kaleidoscope').Dispatch} Dispatch */
/** @typedef {import('../utils/kaleidoscope').Rect} Rect */

/**
 * This component represents the display area for the hex tessellation editor view.
 * @param {object} props
 * @param {[number, number]} props.dims - The view box size in pixels as an array [width, height].
 * @param {HexTessellateState} props.state - The current application state.
 * @param {Dispatch} props.dispatch - The current application dispatch.
 * @returns {JSX.Element}
 */
export default function HexTessellateDisplay({
  dims, state: {
    hexColors, tileShape, tessellations, tessellationIndex, tool, zoom, showOutline,
  }, dispatch,
}) {
  /** Calculate tessellation and possible swaps. */
  const tessellation = tessellations?.[tessellationIndex];
  const mathJSTessellation = useMemo(
    () => tessellation && tessellation.map((point) => [...point]),
    [tessellation],
  );
  const tessellationInv = useMemo(
    () => mathJSTessellation && inv(mathJSTessellation),
    [mathJSTessellation],
  );
  const swaps = useMemo(
    () => mathJSTessellation && getSwaps(tileShape, mathJSTessellation, [HexPoint.origin]),
    [mathJSTessellation, tileShape],
  );

  /** The current swap-able hex that's being hovered on. */
  const [swapHover, setSwapHover] = useState(/** @type {HexPoint} */ (null));

  /** Remove the active swap hover if the tool is no longer tileSwap. */
  useEffect(() => {
    if (tool !== Tools.tileSwap) setSwapHover(null);
  }, [tool]);

  /** Memoize bound event handlers for hexes. */
  const handlers = useMemo(() => {
    /** @type {BoundEventHandler<React.MouseEvent>} */
    const onAdd = (point) => dispatch({
      type: DispatchTypes.hexClick,
      point,
      subtype: DispatchTypes.add,
    });

    /** @type {BoundEventHandler<React.MouseEvent>} */
    const onRemove = (point) => dispatch({
      type: DispatchTypes.hexClick,
      point,
      subtype: DispatchTypes.remove,
    });

    /** @type {BoundEventHandler<React.MouseEvent>} */
    // const onDoubleClick = (point) => dispatch({ type: DispatchTypes.hexDoubleClick, point });

    /** @type {BoundEventHandler<React.MouseEvent>} */
    // eslint-disable-next-line no-bitwise
    const handlePrimary = (point, event) => event.buttons & 1
      && dispatch({ type: DispatchTypes.hexClick, point });

    /** @type {BoundEventHandler<React.MouseEvent>} */
    const onSwapOver = (point) => setSwapHover(point);

    /** @type {BoundEventHandler<React.MouseEvent>} */
    const onSwapLeave = (point) => setSwapHover((prev) => (prev.equals(point) ? null : prev));

    /** @type {BoundEventHandler<React.MouseEvent>} */
    const onSwap = (point) => dispatch({
      type: DispatchTypes.hexClick,
      added: point,
      removed: swaps.get(point),
    });

    return {
      tileShapeAdd: { onClick: onAdd },
      tileShapeRemove: { onClick: onRemove },
      swappable: {
        onClick: onSwap,
        onMouseOver: onSwapOver,
        onMouseLeave: onSwapLeave,
      },
      colorMode: {
        onMouseDown: handlePrimary,
        onMouseEnter: handlePrimary,
        onMouseMove: handlePrimary,
        // onDoubleClick,
      },
    };
  }, [dispatch, swaps]);

  /** Memoize unbound event handlers. */
  const onConfirm = useCallback(
    /** @see HexTessellateState.tool */
    () => dispatch({ type: DispatchTypes.set, name: 'tool', value: null }),
    [dispatch],
  );

  /** SVG Elements for displaying the tile. */
  const outline = showOutline && <HexTileOutline tileShape={tileShape} />;
  const tile = <HexTile hexColors={hexColors} />;

  /** Determine which react elements to display on screen. */
  /** @type {React.Element[]} */
  const displayChildren = [];
  if (tool !== Tools.tileShape && tessellations && tessellationIndex !== null) {
    /** Display copies of SVG hex tile to fill the space on screen (other than the origin). */

    // TODO: Find better way to fill tessellation screen.
    /** Determine the tessellation bounds by the four corners of the screen. */
    /** @type {Rect} */
    const rect = {};
    [rect.left, rect.right] = divide(multiply([-1, 1], dims[0] / 2), zoom);
    [rect.top, rect.bottom] = divide(multiply([-1, 1], dims[1] / 2), zoom);
    const { min: hexMin, max: hexMax, width: hexWidth } = getHexRangeInRect(rect);
    let tessMin = [Infinity, Infinity];
    let tessMax = [-Infinity, -Infinity];
    [
      [hexMax[0], hexMin[1]], // Top-right
      [hexMin[0], hexMax[1]], // Bottom-left
      [hexMax[0] - hexWidth, hexMin[1]], // Top-left
      [hexMin[0] + hexWidth, hexMax[1]], // Bottom-right
    ].forEach((point) => {
      const result = multiply(point, tessellationInv);
      tessMin = min([tessMin, floor(result)], 0);
      tessMax = max([tessMax, ceil(result)], 0);
    });

    /**
     * Base style for non-origin hex tiles.
     * @type {React.CSSProperties}
     */
    const baseStyle = {};

    /** Mute non-origin tiles if we're doing color editing. */
    if ([Tools.colorFill, Tools.colorFlood].includes(tool)) baseStyle.opacity = 0.5;

    /** Iterate through the tessellation grid and add tiles to the displayChildren. */
    for (let i = tessMin[0]; i <= tessMax[0]; i += 1) {
      for (let j = tessMin[1]; j <= tessMax[1]; j += 1) {
        const point = new HexPoint(i, j);
        if (!point.equals(HexPoint.origin)) {
          displayChildren.push(
            <div
              key={`tile ${point}`}
              style={{
                ...baseStyle,
                transform: `translate(${multiply(Hex.grid.spacing, multiply(point, mathJSTessellation))
                  .join('px,')}px`,
              }}
            >
              {outline}
              {tile}
            </div>,
          );
        }
      }
    }
  }

  if ([Tools.tileShape, Tools.tileSwap].includes(tool)) {
    /** Display interactive hexes for the origin tile (without background colors). */
    displayChildren.push(
      <OverlayTrigger
        key={HexPoint.origin}
        delay={100}
        overlay={(
          <Tooltip id="confirm-tileShape-hex-tooltip">
            Confirm Shape
          </Tooltip>
        )}
      >
        <Hexagon
          coords={HexPoint.origin}
          className="confirm btn-success shadow-none cursor-pointer"
          onClick={onConfirm}
        />
      </OverlayTrigger>,
    );

    if (tool === Tools.tileShape) {
      /** Display remove button on edge hexes (excluding origin). */
      const edges = new PointSet(tileShape.edges());
      tileShape.forEach((point) => {
        if (point.equals(HexPoint.origin)) return;
        const canon = point.intern();
        const isEdge = edges.has(point);
        displayChildren.push(
          <Hexagon
            key={canon}
            coords={canon}
            className={classNames({
              'remove btn-primary shadow-none cursor-pointer': isEdge,
              'bg-primary': !isEdge,
            })}
            handlers={edges.has(point) ? handlers.tileShapeRemove : {}}
          />,
        );
      });

      /** Display add button on adjacent hexes. */
      tileShape.adjacent().forEach((point) => {
        const canon = point.intern();
        displayChildren.push(
          <Hexagon
            key={canon}
            coords={canon}
            className="add btn-secondary shadow-none cursor-pointer"
            handlers={handlers.tileShapeAdd}
          />,
        );
      });
    } else { // tool = Tools.tileSwap
      /** Display swappable edge hexes. */

      /** The hex that will be removed if the hovered hex is swapped in. */
      const swapRemove = swapHover && swaps.get(swapHover);

      /** Display the current tile. */
      tileShape.forEach((point) => {
        if (point.equals(HexPoint.origin)) return;
        const canon = point.intern();
        const isSwapRemove = point.equals(swapRemove);
        displayChildren.push(
          <Hexagon
            key={canon}
            coords={canon}
            className={classNames({
              'remove btn-primary active shadow-none': isSwapRemove,
              'bg-primary': !isSwapRemove,
            })}
          />,
        );
      });

      /** Display swappable hexes. */
      swaps.keys().forEach((point) => {
        const canon = point.intern();
        displayChildren.push(
          <Hexagon
            key={canon}
            coords={canon}
            className="add btn-secondary shadow-none cursor-pointer"
            handlers={handlers.swappable}
          />,
        );
      });
    }
  } else if ([Tools.colorFill, Tools.colorFlood].includes(tool)) {
    /** Display interactive hexes for the origin tile (with background colors). */
    hexColors.forEach((color, point) => {
      const canon = point.intern();
      displayChildren.push(
        <Hexagon
          key={canon}
          coords={canon}
          color={color}
          className="cursor-pointer"
          handlers={handlers.colorMode}
        />,
      );
    });

    displayChildren.push(
      <div key="outline">
        {outline}
      </div>,
    );
  } else {
    /** Display non-interactive origin tile SVG. */
    displayChildren.push(
      <div key="tile 0,0">
        {outline}
        {tile}
      </div>,
    );
  }

  return (
    <>
      <div className="HexTessellateDisplay d-flex w-100 h-100 justify-content-center align-items-center">
        <div className="drop-shadow" style={{ transform: `scale(${zoom})` }}>
          {displayChildren}
        </div>
      </div>
      {[Tools.tileShape, Tools.tileSwap].includes(tool) && (
        <Button
          variant="success"
          className="d-block position-absolute bottom-right shadow border mr-2 mb-2"
          onClick={onConfirm}
        >
          <i className="bi-check2-square" />
          {' Confirm Shape'}
        </Button>
      )}
    </>
  );
}
