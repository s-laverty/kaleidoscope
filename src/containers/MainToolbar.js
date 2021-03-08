import './MainToolbar.scss';
import ModeDropdown from './ModeDropdown';
import FileDropdown from './FileDropdown';
import OptionsDropdown from './OptionsDropdown';
import ToolbarButton from '../ToolbarButton';
import FileLoadModal from './FileLoadModal'
import FileSaveModal from './FileSaveModal'
import WhitePlus from '../assets/white-plus.svg';
import RedX from '../assets/red-x.svg';

const MainToolbar = props => {
  const colors = [];
  if (props.mode === 'hex-freestyle') {
    for (let i = 0; i < props.current.colors.length; ++i) {
      const checkDrop = e => {
        if (e.dataTransfer.types.includes('application/x-kaleidoscope-color')
        && Number(e.dataTransfer.getData('application/x-kaleidoscope-color')) !== i) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }
      colors.push(<ToolbarButton key={i}
        onClick={() => props.handleToolbar('set-tool', 'color', i)}
        onDragStart={e => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('application/x-kaleidoscope-color', i);
        }}
        onDragEnter={checkDrop}
        onDragOver={checkDrop}
        onDrop={e => {
          e.preventDefault();
          props.handleToolbar('swap-colors', i,
            Number(e.dataTransfer.getData('application/x-kaleidoscope-color')));
        }}
        selected={props.current.active_color_index === i}
        text={`Color #${i+1}`}
        icon={{
          border: true,
          style: {backgroundColor: props.current.colors[i]}
        }}
        draggable
      />);
    }
  }
  return (
    <div className='MainToolbar'>
      <span className='title flex-center'>Kaleidoscope</span>
      <div className='toolbar-wrapper'>
        <ModeDropdown
          collapsed={props.active_dropdown !== 'mode'}
          mode={props.mode}
          handleToolbar={props.handleToolbar}
        />
        <FileDropdown
          mode={props.mode}
          current={props.current}
          file_operation={props.file_operation}
          collapsed={props.active_dropdown !== 'file'}
          handleToolbar={props.handleToolbar}
        />
        {props.mode === 'hex-freestyle' && <OptionsDropdown
          mode={props.mode}
          current={props.current}
          collapsed={props.active_dropdown !== 'options'}
          handleToolbar={props.handleToolbar}
        />}
        <div className='tools-wrapper'>
          {props.mode === 'hex-freestyle' && colors}
          {props.mode === 'hex-freestyle' && <ToolbarButton
            text='Add Color'
            icon={{src: WhitePlus}}
            onClick={() => props.handleToolbar('add-color')}
          />}
          {props.mode === 'hex-freestyle' && <ToolbarButton
            text='Erase'
            icon={{
              src: RedX,
              style: {backgroundColor: 'white'}
            }}
            selected={props.current.active_tool === 'erase'}
            onClick={() => props.handleToolbar('set-tool', 'erase')}
            onDragEnter={e => {
              if (e.dataTransfer.types.includes('application/x-kaleidoscope-color'))
                e.preventDefault();
            }}
            onDragOver={e => {
              if (e.dataTransfer.types.includes('application/x-kaleidoscope-color'))
                e.preventDefault();
            }}
            onDrop={e => {
              e.preventDefault();
              props.handleToolbar('remove-color',
                Number(e.dataTransfer.getData('application/x-kaleidoscope-color')));
            }}
          />}
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
          {props.mode === 'hex-tessellate' && <ToolbarButton
            text='Tile Shape'
            selected={props.current.active_tool === 'tile-shape'}
            onClick={() => props.handleToolbar('set-tool', 'tile-shape')}
          />}
          {props.mode === 'hex-tessellate' && <ToolbarButton
            text='Tessellate!'
            onClick={() => props.handleToolbar('tessellate')}
            disabled={props.current.active_tool === 'tile-shape'}
          />}
        </div>
      </div>
      {props.file_operation === 'save' &&
      <FileSaveModal
        handleToolbar={props.handleToolbar}
      />}
      {props.file_operation === 'load' &&
      <FileLoadModal
        handleToolbar={props.handleToolbar}
      />}
    </div>
  );
};

export default MainToolbar;
