import { createElement, useState } from "react";

const DropTarget = ({as='div', modifier='dragover', onDragEnter: superEnter, onDragLeave: superLeave,
onDrop: superDrop, className, children, ...other}) => {
  const [dragCounter, setDragCounter] = useState(0);

  let onDragEnter = e => {
    superEnter?.(e);
    if (e.defaultPrevented) setDragCounter(count => count + 1);
  }
  let onDragLeave = e => {
    superLeave?.(e);
    setDragCounter(count => Math.max(0, count - 1));
  }
  let onDrop = e => {
    superDrop?.(e);
    setDragCounter(0);
  }

  if (dragCounter) className = (className?.concat(' ') ?? '') + modifier;

  return createElement(as, {
    className,
    onDragEnter,
    onDragLeave,
    onDrop,
    ...other
  }, children);
};

export default DropTarget;
