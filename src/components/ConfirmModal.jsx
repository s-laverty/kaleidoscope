import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const ConfirmModal = ({title='Confirm', children, onConfirm, onHide, ...other}) => {
  const onCancel = () => {
    onHide();
    onConfirm(false);
  }
  return (
    <Modal backdrop='static' onHide={onCancel} {...other}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => {
          onHide();
          onConfirm(true);
        }}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
