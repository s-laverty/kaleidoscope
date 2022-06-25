import classNames from 'classnames';
import { add, multiply } from 'mathjs';
import React, { memo } from 'react';
import { Hex } from '../utils/config';
/** @template V @typedef {import('../utils/kaleidoscope').HexPointMap<V>} HexPointMap */

/**
 * Component for displaying a non-interactive SVG group of hexes that forms a connected tile.
 * @param {object} props
 * @param {HexPointMap<string>} props.hexColors - A mapping of hex coordinates to colors.
 * @param {string} [props.className] - An optional className to append to the HexTileOutline.
 * @param {object} [props.rest] - All other properties passed into the HexTileOutline props.
 * @returns {JSX.Element}
 */
function HexTile({ hexColors, className, ...rest }) {
  const hexes = hexColors.entries().map(([coords, color]) => {
    const center = multiply(Hex.grid.spacing, coords);
    const points = Hex.vertices.map((point) => add(center, point).join(' '));
    return <polygon key={coords} points={points} fill={color} stroke="none" />;
  });
  return (
    <svg className={classNames('overflow-visible position-absolute', className)} {...rest}>
      {hexes}
    </svg>
  );
}

export default memo(HexTile);
