import './MainToolbar.scss';
import FileDropdown from './FileDropdown';
import OptionsDropdown from './OptionsDropdown';
import ToolbarButton from '../ToolbarButton';
import FileLoadModal from './FileLoadModal'
import FileSaveModal from './FileSaveModal'
import WhitePlus from '../assets/white-plus.svg';
import RedX from '../assets/red-x.svg';

function MainToolbar(props) {
  const colors = [];
  for (let i = 0; i < props.colors.length; ++i) {
    colors.push(<ToolbarButton key={i}
      onClick={() => props.handleToolbar('color', i)}
      selected={props.selected_color_index === i}
      text={`Color #${i+1}`}
      icon={{
        border: true,
        style: {backgroundColor: props.colors[i]}
      }}
    />);
  }
  return (
    <div className='MainToolbar'>
      <span className='title flex-center'>Kaleidoscope</span>
      <FileDropdown
        collapsed={props.selected_dropdown !== 'file'}
        handleToggle={() => props.handleToolbar('dropdown-toggle', 'file')}
        file_operation={props.file_operation}
        handleToolbar={props.handleToolbar}
      />
      <OptionsDropdown
        collapsed={props.selected_dropdown !== 'options'}
        handleToggle={() => props.handleToolbar('dropdown-toggle', 'options')}
        selected_tool={props.selected_tool}
        selected_option={props.selected_option}
        color_picker_value={props.colors[props.selected_color_index]}
        handleToolbar={props.handleToolbar}
      />
      <div className='tools-wrapper'>
        {colors}
        <ToolbarButton
          text='Add Color'
          icon={{src: WhitePlus}}
          onClick={() => props.handleToolbar('add-color')}
        />
        <ToolbarButton
          text='Erase'
          icon={{
            src: RedX,
            style: {backgroundColor: 'white'}
          }}
          selected={props.selected_tool === 'erase'}
          onClick={() => props.handleToolbar('erase')}
        />
      </div>
      {props.file_operation === 'save' &&
      <FileSaveModal
        handleClose={() => props.handleToolbar('file-operation-close')}
        getDownloadURI={props.getDownloadURI}
      />}
      {props.file_operation === 'load' &&
      <FileLoadModal
        handleClose={() => props.handleToolbar('file-operation-close')}
        loadFileText={props.loadFileText}
      />}
    </div>
  );
}

export default MainToolbar;
