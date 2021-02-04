import ToolbarDropdown from '../ToolbarDropdown';
import ToolbarButton from '../ToolbarButton';

function FileDropdown(props) {
  return (
    <ToolbarDropdown
    name='File'
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
    ]}/>
  );
}

export default FileDropdown;
