import React from 'react';
import { Button, Modal } from 'react-bootstrap';

/**
 * Component for displaying a confirmation modal (prompting the user to confirm something).
 * @param {object} props Any unspecified props will be included in the modal's props.
 * @param {string} [props.title=Confirm] - The title of the confirmation prompt.
 * @param {() => void} props.onHide - The modal hiding event handler.
 * @param {() => void} props.onConfirm - The confirmation event handler. This is
 * triggered when the user clicks "confirm".
 * @param {React.ReactChildren} [props.children] - The child components to display in this
 * component. Visible in the body section.
 * @param {object} [props.rest] - All other properties passed into the ConfirmModal props.
 * @returns {JSX.Element}
 */
export default function ConfirmModal({
  title = 'Confirm', onHide, onConfirm, children, ...rest
}) {
  return (
    <Modal backdrop="static" onHide={onHide} {...rest}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>{children}</Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button onClick={() => {
          onHide();
          onConfirm();
        }}
        >
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
