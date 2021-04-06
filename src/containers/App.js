import React from 'react'
import './App.scss';
import DisplayArea from './DisplayArea';
import MainToolbar from './MainToolbar';
import { PointMap, PointSet, Tile } from '../Hexagon';

const VERSION = '0.1.0';

class App extends React.Component {
  static saved_props = {
    'hex-freestyle': ['tiledata','colors','pan','zoom'],
    'hex-tessellate': []
  }
  static default_props = {
    'hex-tessellate': {
      tiledata: new Tile([[new Tile.Point(0,0), {}]]),
      tessellations: [],
      active_tessellation_index: null,
      active_tool: 'tile-shape',
      zoom: 1.0
    },
    'hex-freestyle': {
      tiledata: new PointMap(),
      history: [{tiledata: new PointMap()}],
      history_index: 0,
      colors: ['#ff0000','#00ff00','#0000ff'],
      active_color_index: null,
      active_tool: null,
      active_option: null,
      pan: {x: 0, y: 0},
      zoom: 1.0
    }
  }

  constructor() {
    super();
    this.state = {
      active_dropdown: null,
      mode: 'hex-tessellate',
      file_operation: null,
      ...App.default_props
    };
    this._toolbar_handlers = {
      'set-dropdown': dropdown => {
        this.setState(state => {
          if (state.mode === 'hex-freestyle'
          && state['hex-freestyle'].active_option === 'change-color'
          && !state.active_dropdown) return;
          return {
            active_dropdown: (state.active_dropdown === dropdown ? null : dropdown)
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
      'remove-color': i => this.setState(state => {
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
      }),
      'clear-all': () => {
        if (window.confirm('Are you sure you want to clear everything?')) {
          this.setState(state => ({
            [state.mode]: {...state[state.mode], tiledata: {}}
          }));
        }
      },
      'tile-shape': () => {
        if (this.state[this.state.mode].active_tool === 'tile-shape') this.tessellate();
        else this.setState(state => ({
          [state.mode]: {...state[state.mode],
            tessellations: [],
            active_tessellation_index: null
          }
        }));
        this._toolbar_handlers['set-tool']('tile-shape');
      },
      'set-tessellation-index': i => this.setState(state => ({
        [state.mode]: {...state[state.mode],
          active_tessellation_index: i,
        }
      }))
    };
    this._display_handlers = {
      'hex-click': (point, action) => {
        let log_change = false;
        this.setState(state => {
          const current = state[state.mode];
          let tiledata;
          switch (current.active_tool) {
            case 'color':
              if (current.active_option === 'ink-dropper') {
                let colors = current.colors.slice();
                let color = current.tiledata.get(point)?.color;
                if (color) colors[current.active_color_index] = color;
                return {
                  [state.mode]: {...current,
                    active_option: null,
                    colors: colors
                  }
                };
              } else {
                let tile = current.tiledata.get(point);
                if (tile?.color !== current.colors[current.active_color_index]) {
                  log_change = true;
                  tiledata = new current.tiledata.constructor(current.tiledata);
                  tiledata.set(point, {...tile,
                    color: current.colors[current.active_color_index]
                  });
                  return {
                    [state.mode]: {...current,
                      tiledata: tiledata
                    }
                  };
                }
              }
              break;
            case 'erase':
              log_change = true;
              tiledata = new current.tiledata.constructor(current.tiledata);
              tiledata.delete(point);
              return {
                [state.mode]: {...current,
                  tiledata: tiledata
                }
              };
            case 'tile-shape':
              if (!action) return;
              tiledata = new current.tiledata.constructor(current.tiledata);
              const fill_hole = point => {
                if (!(tiledata.has(point))) {
                  tiledata.set(point, {});
                  point.forEachAdjacent(adj_point => fill_hole(adj_point));
                }
              };
              switch(action) {
                case 'tile-add':
                  tiledata.set(point, {});
                  tiledata.holes().forEach(hole =>
                    fill_hole(hole[0][0].step(hole[0][1])));
                  break;
                case 'tile-remove':
                  tiledata.delete(point);
                  if (!tiledata.isConnected())
                    tiledata = tiledata.getComponent(new Tile.Point(0,0));
                  break;
                default: console.warn(`Unrecognized tile-shape action: ${action}`);
              }
              return {[state.mode]: {...current, tiledata: tiledata}};
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
          tiledata: current.tiledata
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
    let save_state = {mode: this.state.mode};
    let current = this.state[this.state.mode];
    App.saved_props[this.state.mode].forEach(key => save_state[key] = current[key]);
    return encodeURIComponent(JSON.stringify({version: VERSION, ...save_state},
      (_key, value) => {
      if (value instanceof Tile) return {
        dataType: 'Hexagon_Tile',
        data: [...value]
      };
      if (value instanceof PointMap) return {
        dataType: 'Hexagon_PointMap',
        data: [...value]
      }
      if (value instanceof PointSet) return {
        dataType: 'Hexagon_PointSet',
        data: [...value]
      }
      return value;
    }));
  }

  loadFromText(file_text) {
    let result;
    try {
      result = JSON.parse(file_text, (_key, value) => {
        if (value?.dataType === 'Hexagon_Tile') return new Tile(value.data.map(([key, value]) =>
          [new Tile.Point(...key), value]));
        if (value?.dataType === 'Hexagon_PointMap') return new PointMap(value.data.map(([key, value]) =>
        [new Tile.Point(...key), value]));
        if (value?.dataType === 'Hexagon_PointSet') return new PointSet(value.data.map(value =>
        new Tile.Point(...value)));
        return value;
      });
      if (!result.version) {
        result.mode = 'hex-freestyle';
        result.tiledata = new PointMap(Object.entries(result.hexcolors).map(([key, color]) =>
          [new PointMap.Point(...key.split(',').map(Number)), {color: color}]
        ));
        delete result.hexcolors;
      }
      delete result.version;
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
    let current = this.state[this.state.mode];
    let tiledata = current.tiledata;
    let explored = new PointSet([new Tile.Point(0,0)]);
    let path = [];
    const explore = translation => {
      if (explored.has(translation)) return;
      explored.add(translation);
      let tile = tiledata.translate(translation, true);
      if (!tiledata.adjacentTo(tile)) return;
      if (!tiledata.overlaps(tile))
        path.push([translation, tiledata.translate(translation)]);
      for (let i = 0; i < 4; ++i) explore(translation.step(i));
    }
    explore(new Tile.Point(1,0));
    let tessellations = [];
    let exclude1 = new PointSet();
    let exclude2 = new PointSet();
    while (path.length) {
      let [translation1, tile1] = path.shift();
      if (exclude1.has(translation1)) continue;
      exclude2.clear();
      path.forEach(([translation2, tile2]) => {
        if (exclude2.has(translation2)) return;
        if (tile1.adjacentTo(tile2) && !tile1.overlaps(tile2)) {
          let merged = new Tile(tiledata).merge(tile1).merge(tile2)
            .merge(tile1.translate(translation2));
          if (!merged.holes().length) {
            tessellations.push([translation1, translation2]);
            exclude1.add(translation2);
            exclude2.add(translation1.subtract(translation2));
          }
        }
      });
    };
    this.setState(state => ({
      [state.mode]: {...state[state.mode],
        tessellations: tessellations
      }
    }));
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
      const current = state[state.mode];
      if (state.mode === 'hex-freestyle') {
        if (current.active_option === 'change-color-click') {
          return {
            'hex-freestyle': {...current,
              active_option: 'change-color'
            }
          };
        }
      } else if (state.mode === 'hex-tessellate') {
        if (current.active_tool === 'reset-tile-colors') {
          return {
            'hex-tessellate': {...current,
              active_tool: null
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
