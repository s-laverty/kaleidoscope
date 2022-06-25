import classNames from 'classnames';
import React, { useRef } from 'react';
import './Slider.scss';

/**
 * Slider component displays a visible interactive semi-transparent vertical slider.
 * @param {object} props
 * @param {string} [props.className] - An optional className to append to this slider.
 * @param {number} props.offset - On a scale of 0 to 1 (top to bottom), indicates the slider's
 * progress.
 * @param {(offset: number) => void} props.onScroll - A scroll event handler to update the parent
 * progress state.
 * @param {() => void} [props.onDragStart] - An optional drag start event handler for scrubbing.
 * @param {() => void} [props.onDragEnd] - An optional drag end event handler for scrubbing.
 * @param {string} [props.type] - An optional visual type specification for the slider. Options:
 * "zoom"
 * @returns {JSX.Element}
 */
export default function Slider({
  className, offset, onScroll, onDragStart, onDragEnd, type,
}) {
  const wrapper = useRef(/** @type {React.Element} */ (null));
  const topHeight = `${offset * 100}%`;
  const bottomHeight = `${(1 - offset) * 100}%`;
  return (
    <div className={classNames('Slider rounded-pill border border-secondary padding-0 shadow bg-white-transparent', className)}>
      <div className="w-100 h-100 rounded-pill d-flex flex-column justify-content-between overflow-hidden">
        <button
          type="button"
          className="scroll-jump btn-outline-secondary w-100 border-0 outline-0 cursor-pointer d-flex justify-content-center"
          style={{ height: topHeight }}
          onClick={() => onScroll(Math.max(0, offset - 0.1))}
        >
          {type === 'zoom' && <i className="bi-zoom-in align-self-start" />}
        </button>
        <button
          type="button"
          className="scroll-jump btn-outline-secondary w-100 border-0 outline-0 cursor-pointer d-flex justify-content-center"
          style={{ height: bottomHeight }}
          onClick={() => onScroll(Math.min(1, offset + 0.1))}
        >
          {type === 'zoom' && <i className="bi-zoom-out align-self-end" />}
        </button>
      </div>
      <div className="dial-wrapper position-absolute" ref={wrapper}>
        <button
          type="button"
          className="dial btn-primary rounded-circle position-absolute p-0 shadow border border-secondary cursor-grab d-flex justify-content-center"
          style={{ top: topHeight }}
          onMouseDown={(startEvent) => {
            /** Only start dragging for the left mouse button. */
            if (startEvent.button !== 0) return;

            /** Get the initial dial offset from the intial click. */
            const dialRect = startEvent.target.getBoundingClientRect();
            const dialOffset = startEvent.clientY - dialRect.top - dialRect.height / 2;

            /**
             * Handles the cancellation of a scrolling event (removes event handlers).
             * @type {() => void}
             */
            let onCancel;

            /** @type {React.MouseEventHandler} */
            const onMouseMove = (event) => {
              /** Combine the dial offset with the mouse position to determine the new progress. */
              const { top, height } = wrapper.current.getBoundingClientRect();
              let scrollOffset = (event.clientY - dialOffset - top) / height;
              scrollOffset = Math.max(0, Math.min(1, scrollOffset));
              onScroll(scrollOffset);
            };
            window.addEventListener('mousemove', onMouseMove);

            /** @type {React.MouseEventHandler} */
            const onMouseUp = (e) => e.button === 0 && onCancel();
            window.addEventListener('mouseup', onMouseUp);

            window.addEventListener('mouseleave', onCancel, { once: true });

            onCancel = () => {
              window.removeEventListener('mousemove', onMouseMove);
              onDragEnd?.();
            };

            /** Call the optional drag start event handler. */
            onDragStart?.();
          }}
        >
          <i className="bi-chevron-expand h5 m-0 align-self-center" />
        </button>
      </div>
    </div>
  );
}
