import ToolbarDropdown from '../ToolbarDropdown';
import ToolbarButton from '../ToolbarButton';
import './FileDropdown.scss';

const FileDropdown = props => (
  <ToolbarDropdown
    className='FileDropdown'
    title='File'
    collapsed={props.collapsed}
    handleToggle={() => props.handleToolbar('dropdown-toggle', 'file')}
  >
    <ToolbarButton
      text='Load'
      selected={props.file_operation === 'load'}
      onClick={() => props.handleToolbar('load')}
    />
    <ToolbarButton
      text='Save'
      selected={props.file_operation === 'save'}
      onClick={() => props.handleToolbar('save')}
    />
    {props.mode === 'hex-freestyle' && <ToolbarButton
      text='Undo'
      disabled={props.current.history_index === 0}
      onClick={() => props.handleToolbar('undo')}
      title='Ctrl+z'
    />}
    {props.mode === 'hex-freestyle' && <ToolbarButton
      text='Redo'
      disabled={props.current.history_index === props.current.history.length - 1}
      onClick={() => props.handleToolbar('redo')}
      title='Ctrl+y'
    />}
  </ToolbarDropdown>
);

export default FileDropdown;
