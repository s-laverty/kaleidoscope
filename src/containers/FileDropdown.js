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
      buttons={[
        <ToolbarButton key={'load'}
          text='Load'
          selected={props.file_operation === 'load'}
          onClick={() => props.handleToolbar('load')}
        />,
        <ToolbarButton key={'save'}
          text='Save'
          selected={props.file_operation === 'save'}
          onClick={() => props.handleToolbar('save')}
        />
      ]}
    />
  );
}

export default FileDropdown;
