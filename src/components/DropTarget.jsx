import classNames from 'classnames';
import { createElement, useState } from 'react';

/**
 * Component for managing drag & drop interface (all children of this component act as a single
 * drop target).
 * @param {object} props - Any unspecified props will be included in the drop target component's
 * props.
 * @param {React.ComponentType} [props.as=div] - The type of component to render.
 * @param {string} [props.modifier=dragover] - The dragover class modifier to apply to this
 * component.
 * @param {React.DragEventHandler} [props.onDrag] - The drag event handler for this drop target.
 * @param {React.DragEventHandler} [props.onDragEnd] - The drag end event handler for this drop
 * target.
 * @param {React.DragEventHandler} [props.onDragEnter] - The drag enter event handler for this drop
 * target.
 * @param {React.DragEventHandler} [props.onDragLeave] - The drag leave event handler for this drop
 * target.
 * @param {React.DragEventHandler} [props.onDragOver] - The drag over event handler for this drop
 * target.
 * @param {React.DragEventHandler} [props.onDragStart] - The drag enter event handler for this drop
 * target.
 * @param {React.DragEventHandler} [props.onDrop] - The drop event handler for this drop target.
 * @param {string} [props.className] - The className to give this component.
 * @param {React.ReactChildren} [props.children] - The child component to display in this
 * component.
 * @param {object} [props.rest] - All other properties passed into the DropTarget props.
 * @returns {JSX.Element}
 */
export default function DropTarget({
  as = 'div', modifier = 'dragover', onDragEnter, onDragLeave, onDrop, className, children, ...rest
}) {
  /** Keep track of how many layers of children the user has dragged over. */
  const [dragCounter, setDragCounter] = useState(0);

  return createElement(as, {
    className: classNames(className, { [modifier]: dragCounter > 0 }),
    onDragEnter: (event) => {
      onDragEnter?.(event);
      if (event.defaultPrevented) setDragCounter((count) => count + 1);
    },
    onDragLeave: (event) => {
      onDragLeave?.(event);
      setDragCounter((count) => Math.max(0, count - 1));
    },
    onDrop: (event) => {
      onDrop?.(event);
      setDragCounter(0);
    },
    ...rest,
  }, children);
}
