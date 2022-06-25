import classNames from 'classnames';
import {
  add, ceil, floor, multiply, subtract,
} from 'mathjs';
import React, { memo } from 'react';
import { Hex } from '../utils/config';
import './Hexagon.scss';
/** @typedef {import('../utils/kaleidoscope').HexPoint} HexPoint */
/** @typedef {import('../utils/kaleidoscope').Rect} Rect */

/**
 * A bound event handler type: takes a HexPoint as its first argument.
 * @template {React.SyntheticEvent} E The event type.
 * @typedef {(point: HexPoint, event: E) => void} BoundEventHandler */

/**
 * Component for displaying a single interactive Hexagon in the display area. All event handlers are
 * bound with this Hex's coordinates.
 * @param {object} props
 * @param {HexPoint} props.coords - The coordinates of this Hexagon on the grid.
 * @param {string} props.color - The color of the Hexagon.
 * @param {string} [props.className] - An optional className to append to the Hexagon.
 * @param {{ [handler: string]: BoundEventHandler<*> }} [props.handlers] - An optional set of event
 * handlers to be bound with this hex's coordinates as the first call argument.
 * @param {object} [props.rest] - All other properties passed into the Hexagon props.
 * @returns {JSX.Element}
 */
function Hexagon({
  coords, color, className, handlers = {}, ...rest
}) {
  /** @type {React.CSSProperties} */
  const style = {
    backgroundColor: color,
    transform: `translate(-50%,-50%) translate(${multiply(Hex.grid.spacing, coords).join('px,')}px`,
  };
  const boundHandlers = Object.fromEntries(Object.entries(handlers)
    .map(([name, handler]) => [name, (event) => handler(coords, event)]));
  return (
    <div
      className={classNames('Hexagon position-absolute', className)}
      style={style}
      {...boundHandlers}
      {...rest}
    />
  );
}

export default memo(Hexagon);

const partialHexOffset = 2 / 3;
/**
 * Returns a range of hexes that are visible (or partially visible) given a rectangular window.
 * @param {Rect} rect - The boundaries of the rectangular screen.
 * @returns {{ min: [number, number], max: [number, number], width: number, height: number }} The
 * minimum coordinates for each principal axis and the maximum coordinates for each principal axis
 * in the hex space. The width is the maximum number of hexes that are visible across the horizontal
 * span of the rect.
 */
export const getHexRangeInRect = ({
  left, top, right, bottom,
}) => {
  /**
   * The top-right corner of the screen is the maximum horizontal coordinate of hexes and the
   * minimum skew-vertical coordinate of hexes. The bottom-left corner of the screen is the minimum
   * horizontal coordinate of hexes and the maximum skew-vertical coordinate of hexes.
   */
  const [max0, min1] = multiply(Hex.grid.spacingInv, [right, top]);
  const [min0, max1] = multiply(Hex.grid.spacingInv, [left, bottom]);

  /** Round off to partially visible hexes. */
  const min = ceil(subtract([min0, min1], partialHexOffset));
  const max = floor(add([max0, max1], partialHexOffset));

  /** Calculate the hex width (number of hexes from leftmost to rightmost). */
  const width = ceil((right - left) * Hex.grid.spacingInv[0][0]);
  const height = max[1] - min[1];

  return {
    min, max, width, height,
  };
};
