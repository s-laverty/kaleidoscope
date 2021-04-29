import { memo } from 'react';
import './ColorIcon.scss';

const ColorIcon = memo(({color, className, ...other}) => {
  className = (className?.concat(' ') ?? '') +
    'ColorIcon shadow border border-dark rounded-circle align-text-bottom';
  return (
    <div className={className} style={{backgroundColor: color}} {...other}/>
  )
});

export default ColorIcon;
