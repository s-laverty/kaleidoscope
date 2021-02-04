import './MainToolbar.css';
import FileDropdown from './FileDropdown';
import OptionsDropdown from './OptionsDropdown';
import ToolbarButton from '../ToolbarButton';
import Modal from '../Modal';
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
    }}/>);
  }
  return (
    <div className='MainToolbar'>
      <span className='title flex-center'>Kaleidoscope</span>
      <FileDropdown
      file_operation={props.file_operation}
      handleToolbar={props.handleToolbar}/>
      <OptionsDropdown
      selected_tool={props.selected_tool}
      color_picker_value={props.color_picker_value}
      will_pick_color={props.will_pick_color}
      handleToolbar={props.handleToolbar}/>
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
    </div>
  );
}

export default MainToolbar;
