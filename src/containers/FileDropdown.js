import ToolbarDropdown from '../ToolbarDropdown';
import ToolbarButton from '../ToolbarButton';
import './FileDropdown.scss';

const FileDropdown = props => (
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
      disabled={!props.undo}
      onClick={() => props.handleToolbar('undo')}
      title='Ctrl+z'
    />
    <ToolbarButton key={'redo'}
      text='Redo'
      disabled={!props.redo}
      onClick={() => props.handleToolbar('redo')}
      title='Ctrl+y'
    />
  </ToolbarDropdown>
);

export default FileDropdown;
