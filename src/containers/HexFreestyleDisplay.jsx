import classNames from 'classnames';
import {
  divide, multiply, subtract,
} from 'mathjs';
import React, { useMemo } from 'react';
import HexChunk, { getChunkRangeInRect } from '../components/HexChunk';
import { Hex } from '../utils/config';
import { DispatchTypes, HexPoint } from '../utils/kaleidoscope';
/**
 * @template {React.SyntheticEvent} E
 * @typedef {import('../components/Hexagon').BoundEventHandler<E>} BoundEventHandler
 */
/** @typedef {import('../utils/kaleidoscope').Dispatch} Dispatch */
/** @typedef {import('../utils/kaleidoscope').HexFreestyleState} HexFreestyleState */
/** @typedef {import('../utils/kaleidoscope').Rect} Rect */

/**
 * This component represents the display area for the hex freestyle editor view.
 * @param {object} props
 * @param {[number, number]} props.dims - The view box size in pixels as an array [width, height].
 * @param {HexFreestyleState} props.state - The current application state.
 * @param {Dispatch} props.dispatch - The current application dispatch.
 * @returns {JSX.Element}
 */
export default function HexFreestyleDisplay({
  dims, state: {
    hexColors, tool, pan, zoom, showEmpty,
  }, dispatch,
}) {
  /** Memoize bound event handlers for hexes. */
  const handlers = useMemo(() => {
    /** @type {BoundEventHandler<React.MouseEvent>} */
    // eslint-disable-next-line no-bitwise
    const handlePrimary = (point, event) => (event).buttons & 1
        && dispatch({ type: DispatchTypes.hexClick, point });

    /** @type {BoundEventHandler<React.MouseEvent>} */
    const onDoubleClick = (point) => dispatch({ type: DispatchTypes.hexDoubleClick, point });
    return {
      onMouseDown: handlePrimary,
      onMouseEnter: handlePrimary,
      onMouseMove: handlePrimary,
      onDoubleClick,
    };
  }, [dispatch]);

  // TODO fix chunk bug
  /** Calculate which chunks are visible on-screen and load them. */
  const chunks = /** @type {JSX.Element[]} */ ([]);
  /** @type {Rect} */
  const rect = {};
  [rect.left, rect.right] = divide(subtract(multiply([-1, 1], dims[0] / 2), pan[0]), zoom);
  [rect.top, rect.bottom] = divide(subtract(multiply([-1, 1], dims[1] / 2), pan[1]), zoom);
  const {
    min, max, width, height,
  } = getChunkRangeInRect(rect);

  let rowStart = new HexPoint(min[0], max[1]);
  for (let i = 0; i <= height; i += 1, rowStart = rowStart.step(4)) {
    let chunkCoords = rowStart.intern();
    const rowWidth = width + (i % 2);
    for (let j = 0; j <= rowWidth; j += 1, chunkCoords = chunkCoords.step(0).intern()) {
      chunks.push(
        <HexChunk
          key={chunkCoords}
          coords={chunkCoords}
          colors={hexColors.get(chunkCoords)?.colors}
          handlers={handlers}
        />,
      );
    }
    if (i % 2) rowStart = rowStart.step(0);
  }

  /** If we are displaying hex outlines as a background, then they must move with the grid. */
  /** @type {React.CSSProperties} */
  const midgroundStyle = {};
  if (showEmpty) {
    const scaledSize = multiply(Hex.grid.backgroundSize, zoom);
    midgroundStyle.backgroundSize = `${scaledSize[0]}px`;
    midgroundStyle.backgroundPosition = `calc(50% + ${(pan[0] % scaledSize[0]) - scaledSize[0] / 2}px) `
      + `calc(50% + ${pan[1] % scaledSize[1]}px)`;
  }

  /** Return JSX */
  return (
    /**
     * Background layer (optionally displays a gray-white checkerboard to show empty tiles).
     * Does NOT move with grid.
     */
    <div className={classNames('w-100 h-100', { 'bg-missing': showEmpty })}>
      {/* Midground layer (optionally displays outlines of hexes which move with grid). */}
      <div
        className={classNames('d-flex w-100 h-100 justify-content-center align-items-center', {
          'cursor-default': !tool,
          'bg-hexgrid': showEmpty,
        })}
        style={midgroundStyle}
      >
        {/* Foreground layer (contains hexes; represents origin). */}
        <div
          className={classNames({ 'drop-shadow': !showEmpty })}
          style={{ transform: `translate(${pan.join('px,')}px) scale(${zoom})` }}
        >
          {chunks}
        </div>
      </div>
    </div>
  );
}
