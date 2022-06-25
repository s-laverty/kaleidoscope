import classNames from 'classnames';
import { divide, floor } from 'mathjs';
import React, { memo, useMemo } from 'react';
import { Hex } from '../utils/config';
import Hexagon, { getHexRangeInRect } from './Hexagon';
/** @typedef {import('../utils/kaleidoscope').HexPoint} HexPoint */
/** @typedef {import('../utils/kaleidoscope').Rect} Rect */

/**
 * Gets a list of all hex coordinates in a given chunk (sweeping left to right, top to bottom).
 * @param {HexPoint} coords - The coordinates of the chunk (in chunks).
 * @returns {HexPoint[]} A list of all hex coordinates in the chunk.
 */
const getChunkCoords = (coords) => {
  const hexCoordsList = /** @type {HexPoint[]} */ ([]);
  /** @type {HexPoint} */
  let rowStart = coords.multiply(Hex.grid.chunkSize);
  for (let i = 0; i < Hex.grid.chunkSize; i += 1, rowStart = rowStart.step(1)) {
    let hexCoords = rowStart.intern();
    for (let j = 0; j < Hex.grid.chunkSize; j += 1, hexCoords = hexCoords.step(0).intern()) {
      hexCoordsList.push(hexCoords);
    }
  }
  return hexCoordsList;
};

/**
 * This component represents a chunk of hexes visible in the freestyle editor view.
 * @param {object} props
 * @param {HexPoint} props.coords - The coordinates of the chunk (in chunks).
 * @param {string[]} props.colors - The colors of the individual hexes (left to right, top to
 * bottom).
 * @param {string} [props.className] - An optional className to append to all the Hexagons in the
 * chunk.
 * @param {object} [props.rest] - All other properties passed into the Hexagon props.
 */
function HexChunk({
  coords, colors, className, ...rest
}) {
  const hexCoordsList = useMemo(() => getChunkCoords(coords), [coords]);
  return hexCoordsList.map((hexCoords, i) => (
    <Hexagon
      key={hexCoords}
      coords={hexCoords}
      color={colors?.[i]}
      className={classNames('cursor-pointer', className)}
      {...rest}
    />
  ));
}

export default memo(HexChunk);

/**
 * Returns a range of hexes that are visible (or partially visible) given a rectangular window.
 * @param {Rect} rect - The boundaries of
 * the rectangular screen.
 * @returns {{ min: [number, number], max: [number, number], width: number, height: number }} The
 * minimum coordinates for each principal axis and the maximum coordinates for each principal axis
 * in the chunk space. The width is the maximum number of chunks that are visible across the
 * horizontal span of the rect.
 */
export const getChunkRangeInRect = (rect) => {
  /**
   * The top-right corner of the screen is the maximum horizontal coordinate of hexes and the
   * minimum skew-vertical coordinate of hexes. The bottom-left corner of the screen is the minimum
   * horizontal coordinate of hexes and the maximum skew-vertical coordinate of hexes.
   */
  const {
    min, max, width, height,
  } = getHexRangeInRect(rect);
  return {
    min: floor(divide(min, Hex.grid.chunkSize)),
    max: floor(divide(max, Hex.grid.chunkSize)),
    width: floor((min[0] + width) / Hex.grid.chunkSize) - floor(min[0] / Hex.grid.chunkSize),
    height: floor((min[1] + height) / Hex.grid.chunkSize) - floor(min[1] / Hex.grid.chunkSize),
  };
};
