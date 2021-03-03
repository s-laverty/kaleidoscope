import React from 'react'
import './App.scss';
import DisplayArea from './DisplayArea';
import MainToolbar from './MainToolbar';
import {deepEqual, add} from 'mathjs';

class App extends React.Component {
  static saved_props = {
    'hex-freestyle': new Set(['hexcolors','colors','pan','zoom']),
    'hex-tessellate': new Set()
  }
  static default_props = {
    'hex-freestyle': {
      hexcolors: {},
      history: [{hexcolors: {}}],
      history_index: 0,
      colors: ['#ff0000','#00ff00','#0000ff'],
      active_color_index: null,
      active_tool: null,
      active_option: null,
      pan: {x: 0, y: 0},
      zoom: 1.0
    },
    'hex-tessellate': {
      tiledata: {},
      translate: null,
      active_tool: null,
      zoom: 1.0
    }
  }

  constructor() {
    super();
    this.state = {
      active_dropdown: null,
      mode: 'hex-freestyle',
      file_operation: null,
      ...App.default_props
    };
    this._toolbar_handlers = {
      'dropdown-toggle': dropdown => {
        this.setState(state => {
          if (state.mode === 'hex-freestyle'
          && state['hex-freestyle'].active_option === 'change-color'
          && !state.active_dropdown) return;
          return {
            active_dropdown: (state.active_dropdown === dropdown ? null : dropdown),
            active_option: null
          };
        });
      },
      'set-mode': mode => this.setState({mode: mode}),
      'set-file-operation': operation => this.setState({file_operation: operation}),
      'load-from-text': file_text => this.loadFromText(file_text),
      'get-save-uri': () => this.getSaveURI(),
      'undo': () => {
        this.setState(state => {
          const current = state[state.mode];
          if (current.history_index) {
            return {
              [state.mode]: {...current,
                history_index: current.history_index - 1,
                ...current.history[current.history_index - 1]
              }
            };
          }
        });
      },
      'redo': () => {
        this.setState(state => {
          const current = state[state.mode];
          if (current.history && current.history.length > current.history_index + 1) {
            return {
              [state.mode]: {...current,
                history_index: current.history_index + 1,
                ...current.history[current.history_index + 1]
              }
            };
          }
        });
      },
      'set-tool': (tool, ...args) => this.setState(state => {
        const current = state[state.mode];
        const other = {};
        if ('active_color_index' in current) other.active_color_index = null;
        if (tool === 'color') {
          const i = args[0];
          if (current.active_color_index === i) tool = null;
          else other.active_color_index = i;
        } else if (current.active_tool === tool) tool = null;
        return {[state.mode]: {...current, active_tool: tool, ...other}};
      }),
      'set-option': (option, ...args) => this.setState(state => {
        const current = state[state.mode];
        const other = {};
        if (current.active_option === option) option = null;
        return {[state.mode]: {...current, active_option: option, ...other}};
      }),
      'swap-colors': (...args) => this.setState(state => {
        const current = state[state.mode];
        let [i,j] = args.sort();
        let active_color_index = current.active_color_index;
        if (active_color_index === i) active_color_index = j;
        else if (active_color_index === j) active_color_index = i;
        const colors = current.colors.slice();
        let temp = colors[i];
        colors[i] = colors[j];
        colors[j] = temp;
        return {
          [state.mode]: {...current,
            active_color_index: active_color_index,
            colors: colors
          }
        };
      }),
      'add-color': () => this.setState(state => {
        const current = state[state.mode];
        const new_color = `#${Math.floor(Math.random()*(1<<(8*3))).toString(16).padStart(6,'0')}`;
        const colors = current.colors.slice();
        colors.push(new_color);
        return {
          [state.mode]: {...current,
            active_tool: 'color',
            active_option: 'change-color-click',
            colors: colors,
            active_color_index: current.colors.length
          }
        };
      }),
      'change-color': color => {
        this.setState(state => {
          const current = state[state.mode];
          const colors = current.colors.slice();
          colors[current.active_color_index] = color;
          return {
            [state.mode]: {...current, colors: colors}
          };
        });
      },
      'remove-color': i => {
        this.setState(state => {
          const current = state[state.mode];
          let active_color_index = current.active_color_index;
          if (i === undefined) i = active_color_index;
          if (i === active_color_index) active_color_index = null;
          else if (i < active_color_index) --active_color_index;
          const colors = current.colors.slice(0, i).concat(
            current.colors.slice(i + 1));
          return {
            [state.mode]: {...current,
              active_tool: null,
              colors: colors,
              active_color_index: active_color_index
            }
          };
        });
      },
      'clear-all': () => {
        if (window.confirm('Are you sure you want to clear everything?')) {
          this.setState(state => ({
            [state.mode]: {...state[state.mode], hexcolors: {}}
          }));
        }
      },
      'tessellate': () => this.tessellate()
    };
    this._display_handlers = {
      'hex-click': (key, ...args) => {
        let log_change = false;
        this.setState(state => {
          const current = state[state.mode];
          switch (current.active_tool) {
            case 'color':
              if (current.active_option === 'ink-dropper') {
                const colors = current.colors.slice();
                if (current.hexcolors[key])
                  colors[current.active_color_index] = current.hexcolors[key];
                return {
                  [state.mode]: {...current,
                    active_option: null,
                    colors: colors
                  }
                }
              } else {
                if (current.hexcolors[key] !== current.colors[current.active_color_index]) {
                  log_change = true;
                  return {
                    [state.mode]: {...current,
                      hexcolors: {...current.hexcolors,
                        [key]: current.colors[current.active_color_index]
                      }
                    }
                  }
                }
              }
              break;
            case 'erase':
              log_change = true;
              const hexcolors = {...current.hexcolors};
              delete hexcolors[key];
              return {
                [state.mode]: {...current,
                  hexcolors: hexcolors
                }
              }
            case 'tile-shape':
              if (!(key in current.tiledata)) {
                return {
                  [state.mode]: {...current,
                    tiledata: {...current.tiledata, [key]: [...args]}
                  }
                }
              }
              break;
            default: break;
          }
        }, () => log_change && this.saveState());
      },
      'pan': (dx,dy) => this.setState(state => {
        const current = state[state.mode];
        return {
          [state.mode]: {...current,
            pan: {x: current.pan.x + dx, y: current.pan.y + dy}
          }
        };
      }),
      'zoom': zoom => this.setState(state => {
        const current = state[state.mode];
        const ratio = zoom / current.zoom;
        let other = {};
        if ('pan' in current) other.pan = {
          x: current.pan.x * ratio,
          y: current.pan.y * ratio
        }
        return {
          [state.mode]: {...current, zoom: zoom, ...other}
        };
      })
    };
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleDisplay = this.handleDisplay.bind(this);
    this.handleToolbar = this.handleToolbar.bind(this);
  }

  saveState() {
    this.setState(state => {
      if (state.mode === 'hex-freestyle') {
        const current = state['hex-freestyle'];
        const next = {
          hexcolors: current.hexcolors
        };
        const previous = current.history[current.history_index];
        if (Object.entries(next).every(([key,val]) => val === previous[key])) return;
        const start = Math.max(current.history_index-(200-2), 0);
        const history = current.history.slice(start,current.history_index+1);
        history.push(next);
        return {
          'hex-freestyle': {...current,
            history: history,
            history_index: history.length - 1
          }
        };
      }
    });
  }

  handleClick() {
    this.setState(state => {
      const current = state[state.mode];
      if (current.active_option === 'change-color')
        return {
          [state.mode]: {...current,
            active_option: null
          }
        };
    });
  }

  handleKeyDown(e) {
    if (e.ctrlKey) {
      if (e.key === 'z') this.handleToolbar('undo');
      else if (e.key === 'y') this.handleToolbar('redo');
    }
  }

  handleDisplay(type, ...args) {
    const handler = this._display_handlers[type];
    if (handler === undefined) {
      console.warn(`Unrecognized display action: ${type}`);
      return;
    }
    return handler(...args);
  }

  handleToolbar(type, ...args) {
    const handler = this._toolbar_handlers[type];
    if (handler === undefined) {
      console.warn(`Unrecognized toolbar action: ${type}`);
      return;
    }
    return handler(...args);
  }

  getSaveURI() {
    const save_state = {mode: this.state.mode};
    const current = this.state[this.state.mode];
    App.saved_props[this.state.mode].forEach(key => save_state[key] = current[key]);
    return encodeURIComponent(JSON.stringify(save_state));
  }

  loadFromText(file_text) {
    let result;
    try {
      result = JSON.parse(file_text);
    } catch (e) {
      return 'invalid';
    }
    if (result.mode !== this.state.mode) return 'wrong-mode';
    delete result.mode;
    const valid_props = new Set(App.saved_props[this.state.mode]);
    for (let prop in result) {
      if (!valid_props.has(prop)) return 'invalid';
      valid_props.delete(prop);
    }
    if (valid_props.size) return 'invalid';
    if (window.confirm('Are you sure you want to load this file? All unsaved changes will be lost.')) {
      this.setState({...result,
        [this.state.mode]: {...App.default_props[this.state.mode], ...result}
      });
      return 'success';
    }
    return 'user-cancel';
  }

  tessellate() {
    const hasOverlap = (tile1, tile2, translate=[0,0]) => {
      for (let p2 of Object.values(tile2)) {
        p2 = add(p2, translate);
        for (let p1 of Object.values(tile1)) {
          if (deepEqual(p1,p2)) return true;
        }
      }
      return false;
    }
    const current = this.state[this.state.mode];
    const tiledata = current.tiledata;
    let translateX = 1;
    while (hasOverlap(tiledata, tiledata, [translateX,0])) ++translateX;
    this.setState(state => ({
      [state.mode]: {...current, translate: [translateX,0]}
    }));
    const moves = [
      [1,0],
      [0,1],
      [-1,1],
      [-1,0],
      [0,-1],
      [1,-1]
    ];
    let previous_move = 1;
    window.setInterval(() => {
      const current = this.state[this.state.mode];
      for (let i = (previous_move + 1) % 6; true; i = (i+5) % 6) {
        const new_translate = add(current.translate, moves[i]);
        if (!hasOverlap(tiledata, tiledata, new_translate)) {
          previous_move = i;
          this.setState(state => ({
            [state.mode]: {...current, translate: new_translate}
          }));
          break;
        }
      }
    }, 500);
  }

  render() {
    return (
      <div className='App' onClick={this.handleClick}>
        <DisplayArea
          mode={this.state.mode}
          current={this.state[this.state.mode]}
          handleDisplay={this.handleDisplay}
        />
        <MainToolbar
          mode={this.state.mode}
          current={this.state[this.state.mode]}
          file_operation={this.state.file_operation}
          active_dropdown={this.state.active_dropdown}
          handleToolbar={this.handleToolbar}
        />
      </div>
    );
  }
  componentDidUpdate() {
    this.setState(state => {
      if (state.mode === 'hex-freestyle') {
        const current = state['hex-freestyle'];
        if (current.active_option === 'change-color-click') {
          return {
            'hex-freestyle': {...current,
              active_option: 'change-color'
            }
          };
        }
      }
    });
  }
  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  }
  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }
}

export default App;
