import ToolbarDropdown from '../ToolbarDropdown';
import ToolbarButton from '../ToolbarButton';
import './ModeDropdown.scss';

const ModeDropdown = props => (
  <ToolbarDropdown
    className='ModeDropdown'
    title='Mode'
    collapsed={props.collapsed}
    handleToggle={() => props.handleToolbar('set-dropdown', 'mode')}
  >
    <ToolbarButton
      text='Hexagon Tessellation'
      selected={props.mode === 'hex-tessellate'}
      onClick={() => props.handleToolbar('set-mode', 'hex-tessellate')}
    />
    <ToolbarButton
      text='Hexagon Freestyle'
      selected={props.mode === 'hex-freestyle'}
      onClick={() => props.handleToolbar('set-mode', 'hex-freestyle')}
    />
  </ToolbarDropdown>
);

export default ModeDropdown;
