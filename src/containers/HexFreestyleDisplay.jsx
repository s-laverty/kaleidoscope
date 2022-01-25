import classNames from 'classnames';
import { divide, floor, multiply, subtract } from 'mathjs';
import { memo, useCallback } from 'react';
import Hexagon, { getHexRange, X_SPACING, Y_SPACING } from '../components/Hexagon';
import { HexPoint } from '../utils/HexUtils';
import { CHUNK_SIZE } from '../utils/KaleidoscopeUtils';
/** @typedef {import('react').CSSProperties} CSSProperties */
/** @typedef {import('react').Dispatch<*>} Dispatch */
/** @typedef {import('../utils/Point').PointMap<V>} PointMap @template V */

export const Chunk = memo(
  /**
   * This component represents a chunk of hexes visible in the freestyle editor view.
   * @param {object} props
   * @param {PointMap<string>} props.tiledata - The colors of the individual hexes.
   * @param {number} props.x - The x-coordinate of the chunk (in chunks).
   * @param {number} props.y - The y-coordinate of the chunk (in chunks).
   * @param {symbol} props.signature - The edit signature of the chunk (signals change).
   * @param {object} props.rest - The additional properties passed on to every Hexagon component.
   * @returns {JSX.Element}
   */
  function Chunk({ tiledata, x, y, signature, ...rest }) {

    // Load individual hexes within the chunk.
    let hexes = /** @type {JSX.Element[]} */ ([]);
    [x, y] = multiply([x, y], CHUNK_SIZE);
    for (let i = 0; i < CHUNK_SIZE; ++i, ++x) {
      for (let j = 0; j < CHUNK_SIZE; ++j, ++y) {
        let point = new HexPoint(x, y);
        hexes.push(
          <Hexagon
            key={point}
            x={x}
            y={y}
            className='cursor-pointer'
            color={tiledata.get(point)}
            {...rest}
          />
        );
      }
      y -= CHUNK_SIZE;
    }

    // Return list of hexes.
    return hexes;
  },

  // Memo condition (check if edit signature matches old one).
  ({ signature: prev }, { signature: next }) => next === prev
);

/**
 * This component represents the display area for the hex freestyle editor view.
 * @param {object} props
 * @param {[number, number]} props.dims - The viewbox size in pixels as an array [width, height].
 * @param {PointMap<string>} props.tiledata - The colors of the individual hexes.
 * @param {PointMap<symbol>} props.chunk_signatures The edit signature of each chunk.
 * @param {string} props.tool - The current tool being used to edit the project.
 * @param {[number, number]} props.pan - The scroll offset from the origin of the display.
 * @param {number} props.zoom - How much the user has zoomed in our out on the display.
 * @param {boolean} props.show_empty - Whether or not to show empty (color === null) hexes.
 * @param {Dispatch} props.dispatch - The dispatch function for the app state reducer.
 * @returns {JSX.Element}
 */
export default function HexFreestyleDisplay({
  dims, tiledata, chunk_signatures, tool, pan, zoom, show_empty, dispatch
}) {

  // Memoize event handlers for hexes.
  const onMouseDown = useCallback(
    (e, point) => e.buttons & 1 && dispatch({ type: 'hex-click', point }),
    [dispatch]
  );
  const onDoubleClick = useCallback(
    (_e, point) => dispatch({ type: 'hex-doubleclick', point }),
    [dispatch]
  );

  // Calculate which chunks are visible on-screen and load them.
  let chunks = /** @type {JSX.Element[]} */ ([]);
  let x_range = divide(subtract(multiply([-1, 1], dims[0] / 2), pan[0]), zoom);
  let y_range = divide(subtract(multiply([-1, 1], dims[1] / 2), pan[1]), zoom);
  [x_range, y_range] = floor(divide(getHexRange(x_range, y_range), CHUNK_SIZE));
  for (let x = x_range[0]; x <= x_range[1]; ++x) {
    for (let y = y_range[0]; y <= y_range[1]; ++y) {
      let chunk = new HexPoint(x, y);
      chunks.push(
        <Chunk
          key={chunk}
          tiledata={tiledata}
          x={x}
          y={y}
          signature={chunk_signatures.get(chunk)}
          onMouseDown={onMouseDown} onMouseEnter={onMouseDown}
          onMouseMove={onMouseDown} onDoubleClick={onDoubleClick}
        />
      );
    }
  }

  // Configure the display based on state properties
  const backgroundClassName = classNames('w-100 h-100', {
    'bg-missing': show_empty
  });
  const midgroundClassName = classNames('d-flex w-100 h-100 justify-content-center align-items-center', {
    'cursor-default': !tool,
    'bg-hexgrid': show_empty
  });
  const containerClassName = classNames({
    'drop-shadow': !show_empty
  });
  const midgroundStyle = /** @type {CSSProperties} */ ({});
  if (show_empty) {
    const gridSpacing = multiply([X_SPACING, 2 * Y_SPACING], zoom);
    midgroundStyle.backgroundSize = `${gridSpacing[0]}px`;
    midgroundStyle.backgroundPosition = `calc(50% + ${pan[0] % gridSpacing[0] - gridSpacing[0] / 2}px) `
      + `calc(50% + ${pan[1] % gridSpacing[1]}px)`;
  }

  // Return JSX
  return (
    <div className={backgroundClassName} >
      <div className={midgroundClassName} style={midgroundStyle} >
        <div
          className={containerClassName}
          style={{ transform: `translate(${pan.join('px,')}px) scale(${zoom})` }}
        >
          {chunks}
        </div>
      </div>
    </div>
  );
};
