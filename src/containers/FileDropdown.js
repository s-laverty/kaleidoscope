import ToolbarDropdown from '../ToolbarDropdown';
import ToolbarButton from '../ToolbarButton';
import './FileDropdown.scss'

function FileDropdown(props) {
  return (
    <ToolbarDropdown
      className='FileDropdown'
      title='File'
      collapsed={props.collapsed}
      handleToggle={props.handleToggle}
    >
      <ToolbarButton key={'load'}
        text='Load'
        selected={props.file_operation === 'load'}
        onClick={() => props.handleToolbar('load')}
      />
      <ToolbarButton key={'save'}
        text='Save'
        selected={props.file_operation === 'save'}
        onClick={() => props.handleToolbar('save')}
      />
      <ToolbarButton key={'undo'}
        text='Undo'
        disabled={true}
        onClick={() => props.handleToolbar('undo')}
      />
      <ToolbarButton key={'redo'}
        text='Redo'
        disabled={true}
        onClick={() => props.handleToolbar('redo')}
      />
    </ToolbarDropdown>
  );
}

export default FileDropdown;
