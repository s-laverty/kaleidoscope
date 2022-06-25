import classNames from 'classnames';
import React, { memo } from 'react';
import './ColorIcon.scss';

/**
 * Component for managing drag & drop interface (all children of this component act as a single
 * drop target).
 * @param {object} props - Any unspecified props will be included in the color icon's props.
 * @param {string} props.color - The color of the icon.
 * @param {string} [props.className] - An optional className to append to this color icon.
 * @param {object} [props.rest] - All other properties passed into the DropTarget props.
 * @returns {JSX.Element}
 */
function ColorIcon({ color, className, ...rest }) {
  return (
    <div
      className={classNames('ColorIcon shadow border border-dark rounded-circle align-text-bottom', className)}
      style={{ backgroundColor: color }}
      {...rest}
    />
  );
}

export default memo(ColorIcon);
