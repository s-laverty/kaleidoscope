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
      onClick={() => props.handleToolbar('set-file-operation', 'load')}
    />
    <ToolbarButton
      text='Save'
      selected={props.file_operation === 'save'}
      onClick={() => props.handleToolbar('set-file-operation', 'save')}
    />
  </ToolbarDropdown>
);

export default FileDropdown;
