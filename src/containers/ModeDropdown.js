import ToolbarDropdown from '../ToolbarDropdown';
import ToolbarButton from '../ToolbarButton';
import './ModeDropdown.scss';

const ModeDropdown = props => (
  <ToolbarDropdown
    className='ModeDropdown'
    title='Mode'
    collapsed={props.collapsed}
    handleToggle={() => props.handleToolbar('dropdown-toggle', 'mode')}
  >
    <ToolbarButton
      text='Hexagon Freestyle'
      selected={props.mode === 'hex-freestyle'}
      onClick={() => props.handleToolbar('set-mode', 'hex-freestyle')}
    />
    <ToolbarButton key={'save'}
      text='Hexagon Tessellation'
      selected={props.mode === 'hex-tessellate'}
      onClick={() => props.handleToolbar('set-mode', 'hex-tessellate')}
    />
  </ToolbarDropdown>
);

export default ModeDropdown;
