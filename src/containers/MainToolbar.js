import './MainToolbar.scss';
import ModeDropdown from './ModeDropdown';
import FileDropdown from './FileDropdown';
import OptionsDropdown from './OptionsDropdown';
import ToolbarDropdown from '../ToolbarDropdown'
import ToolbarButton from '../ToolbarButton';
import FileLoadModal from './FileLoadModal'
import FileSaveModal from './FileSaveModal'
import WhitePlus from '../assets/white-plus.svg';
import RedX from '../assets/red-x.svg';

const MainToolbar = props => {
  const {mode, current, file_operation, handleToolbar} = props;
  const tessellation_options = [];
  if (mode === 'hex-tessellate') {
    for (let i = 0; i < current.tessellations.length; ++i) {
      tessellation_options.push(<ToolbarButton key={i}
        onClick={() => handleToolbar('set-tessellation-index', i)}
        selected={current.active_tessellation_index === i}
        text={`Option #${i+1}`}
      />);
    }
  }
  const colors = [];
  if (mode === 'hex-freestyle') {
    for (let i = 0; i < current.colors.length; ++i) {
      const checkDrop = e => {
        if (e.dataTransfer.types.includes('application/x-kaleidoscope-color')
        && Number(e.dataTransfer.getData('application/x-kaleidoscope-color')) !== i) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }
      colors.push(<ToolbarButton key={i}
        onClick={() => handleToolbar('set-tool', 'color', i)}
        onDragStart={e => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('application/x-kaleidoscope-color', i);
        }}
        onDragEnter={checkDrop}
        onDragOver={checkDrop}
        onDrop={e => {
          e.preventDefault();
          handleToolbar('swap-colors', i,
            Number(e.dataTransfer.getData('application/x-kaleidoscope-color')));
        }}
        selected={current.active_color_index === i}
        text={`Color #${i+1}`}
        icon={{
          border: true,
          style: {backgroundColor: current.colors[i]}
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
          mode={mode}
          handleToolbar={handleToolbar}
        />
        <FileDropdown
          mode={mode}
          current={current}
          file_operation={file_operation}
          collapsed={props.active_dropdown !== 'file'}
          handleToolbar={handleToolbar}
        />
        {mode === 'hex-tessellate' && <ToolbarDropdown
          title='Tessellate'
          disabled={current.active_tool === 'tile-shape' ||
            !current.tessellations.length}
          collapsed={props.active_dropdown !== 'tessellate'}
          handleToggle={() => handleToolbar('set-dropdown', 'tessellate')}
        >{tessellation_options}</ToolbarDropdown>}
        {mode === 'hex-freestyle' && <OptionsDropdown
          mode={mode}
          current={current}
          collapsed={props.active_dropdown !== 'options'}
          handleToolbar={handleToolbar}
        />}
        <div className='tools-wrapper'>
          {mode === 'hex-freestyle' && <>
            {colors}
            <ToolbarButton
              text='Add Color'
              icon={{src: WhitePlus}}
              onClick={() => handleToolbar('add-color')}
            />
            <ToolbarButton
              text='Erase'
              icon={{
                src: RedX,
                style: {backgroundColor: 'white'}
              }}
              selected={current.active_tool === 'erase'}
              onClick={() => handleToolbar('set-tool', 'erase')}
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
                handleToolbar('remove-color',
                  Number(e.dataTransfer.getData('application/x-kaleidoscope-color')));
              }}
            />
            <ToolbarButton
              text='Undo'
              disabled={current.history_index === 0}
              onClick={() => handleToolbar('undo')}
              title='Ctrl+z'
            />
            <ToolbarButton
              text='Redo'
              disabled={current.history_index === current.history.length - 1}
              onClick={() => handleToolbar('redo')}
              title='Ctrl+y'
            />
          </>}
          {mode === 'hex-tessellate' && <>
            <ToolbarButton
              text='Tile Shape'
              selected={current.active_tool === 'tile-shape'}
              onClick={() => handleToolbar('tile-shape')}
            />
            <ToolbarButton
              text='Reset Colors'
              disabled={current.active_tessellation_index === null}
              onClick={() => handleToolbar('set-tool', 'reset-tile-colors')}
            />
          </>}
        </div>
      </div>
      {file_operation === 'save' &&
        <FileSaveModal
          handleToolbar={handleToolbar}
        />
      }
      {file_operation === 'load' &&
        <FileLoadModal
          handleToolbar={handleToolbar}
        />
      }
    </div>
  );
};

export default MainToolbar;
