import classNames from 'classnames';
import { add, multiply } from 'mathjs';
import React, { memo } from 'react';
import { Hex } from '../utils/config';
/** @typedef {import('../utils/kaleidoscope').HexPoint} HexPoint */
/** @typedef {import('../utils/kaleidoscope').HexSet} HexSet */

/**
 * Component for displaying a non-interactive SVG outline around one or more hexes in the grid.
 * @param {object} props
 * @param {HexSet} props.tileShape - A set of hexes to display the (perimeter) outline for.
 * @param {string} [props.className] - An optional className to append to the HexTileOutline.
 * @param {object} [props.rest] - All other properties passed into the HexTileOutline props.
 * @returns {JSX.Element}
 */
function HexTileOutline({ tileShape, className, ...rest }) {
  /** Calculate outline points from hex component perimeter */
  /** @type {HexPoint[]} */
  const points = [];
  const perimeter = tileShape.perimeter();
  perimeter.reduceRight(([prevCoords, prevEdge], current) => {
    const [coords, edge] = current;
    if (!coords.equals(prevCoords)) {
      points.push(
        add(Hex.outline.vertices[(prevEdge + 5) % 6], multiply(Hex.grid.spacing, prevCoords)),
      );
    }
    points.push(add(Hex.outline.vertices[edge], multiply(Hex.grid.spacing, coords)));
    return current;
  }, perimeter[0]);

  return (
    <svg className={classNames('overflow-visible position-absolute', className)} {...rest}>
      <polygon
        points={points.join(' ')}
        fill="none"
        strokeWidth={Hex.outline.width}
        stroke={Hex.outline.color}
      />
    </svg>
  );
}

export default memo(HexTileOutline);
