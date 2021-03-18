import React from 'react'
import './App.scss';
import DisplayArea from './DisplayArea';
import MainToolbar from './MainToolbar';
import Hexagon from '../Hexagon';

class App extends React.Component {
  static saved_props = {
    'hex-freestyle': new Set(['tiledata','colors','pan','zoom']),
    'hex-tessellate': new Set()
  }
  static default_props = {
    'hex-freestyle': {
      tiledata: new Hexagon.Map(),
      history: [{tiledata: new Hexagon.Map()}],
      history_index: 0,
      colors: ['#ff0000','#00ff00','#0000ff'],
      active_color_index: null,
      active_tool: null,
      active_option: null,
      pan: {x: 0, y: 0},
      zoom: 1.0
    },
    'hex-tessellate': {
      tiledata: new Hexagon.Map([[[0,0], {edges: 0b111111}]]),
      adjacent: new Hexagon.Set(Hexagon.steps),
      tessellations: [],
      active_tessellation_index: null,
      active_tool: 'tile-shape',
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
                  tiledata = new Hexagon.Map(current.tiledata);
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
              tiledata = new Hexagon.Map(current.tiledata);
              tiledata.delete(point);
              return {
                [state.mode]: {...current,
                  tiledata: tiledata
                }
              };
            case 'tile-shape':
              if (!action) return;
              tiledata = new Hexagon.Map(current.tiledata);
              let adjacent = new Hexagon.Set(current.adjacent);
              const toggle_edge = (point, i) => {
                const current = tiledata.get(point);
                tiledata.set(point, {...current,
                  edges: current.edges ^ (1<<i)
                });
              };
              const fill_hole = point => {
                if (!(tiledata.has(point))) {
                  adjacent.delete(point);
                  tiledata.set(point, {edges: 0});
                  Hexagon.forEachAdjacent(point, adj_point => fill_hole(adj_point));
                }
              };
              const remove_adjacent = point => {
                Hexagon.forEachAdjacent(point, adj_point => {
                  if (adjacent.has(adj_point) && !Hexagon.someAdjacent(adj_point,
                    point => tiledata.has(point)
                  )) adjacent.delete(adj_point);
                });
              };
              switch(action) {
                case 'tile-add':
                  tiledata.set(point, {edges: 0});
                  adjacent.delete(point);
                  Hexagon.forEachAdjacent(point, (adj_point, i) => {
                    if (tiledata.has(adj_point)) toggle_edge(adj_point, (i+3)%6);
                    else {
                      adjacent.add(adj_point);
                      tiledata.get(point).edges |= 1<<i;
                    }
                  });
                  for (const hole of Hexagon.getHoles(tiledata)) {
                    for (const [point, edge] of hole) toggle_edge(point, edge);
                    const [start_point, start_edge] = hole[0];
                    fill_hole(Hexagon.step(start_point, start_edge));
                  }
                  break;
                case 'tile-remove':
                  tiledata.delete(point);
                  adjacent.add(point);
                  Hexagon.forEachAdjacent(point, (adj_point, i) =>
                    tiledata.has(adj_point) && toggle_edge(adj_point, (i+3)%6)
                  );
                  remove_adjacent(point);
                  for (const connected_part of Hexagon.getConnectedParts(tiledata)) {
                    if (connected_part.has([0,0])) continue;
                    for (const point of connected_part.keys()) {
                      tiledata.delete(point);
                      remove_adjacent(point);
                    }
                  }
                  break;
                default: console.warn(`Unrecognized tile-shape action: ${action}`);
              }
              return {
                [state.mode]: {...current,
                  tiledata: tiledata, adjacent: adjacent
                }
              };
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
    const save_state = {mode: this.state.mode};
    const current = this.state[this.state.mode];
    for (const key of App.saved_props[this.state.mode]) save_state[key] = current[key];
    return encodeURIComponent(JSON.stringify(save_state, (_key, value) => {
      if (value instanceof Hexagon.Map) return {
        dataType: 'Hexagon.Map',
        data: [...value]
      };
      if (value instanceof Hexagon.Set) return {
        dataType: 'Hexagon.Set',
        data: [...value]
      }
      return value;
    }));
  }

  loadFromText(file_text) {
    let result;
    try {
      result = JSON.parse(file_text, (_key, value) => {
        if (value?.dataType === 'Hexagon.Map') return new Hexagon.Map(value.data);
        if (value?.dataType === 'Hexagon.Set') return new Hexagon.Set(value.data);
        return value;
      });
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
    const current = this.state[this.state.mode];
    const tiledata = current.tiledata;
    const explored = new Hexagon.Set([[0,0]]);
    const path = [];
    const explore = translate => {
      explored.add(translate);
      const tile = Hexagon.translate(tiledata, translate);
      if (!Hexagon.tilesAdjacent(tiledata, tile)) return;
      if (!Hexagon.hasOverlap(tiledata, tile)) path.push([translate, tile]);
      for (let i = 0; i < 4; ++i) {
        const new_translate = Hexagon.step(translate, i);
        if (!explored.has(new_translate)) explore(new_translate);
      }
    }
    explore([1,0]);
    const tessellations = [];
    const exclude1 = new Hexagon.Set();
    const exclude2 = new Hexagon.Set();
    while (path.length) {
      let [translate1, tile1] = path.shift();
      if (exclude1.has(translate1)) continue;
      exclude2.clear();
      path.forEach(([translate2,tile2]) => {
        if (exclude2.has(translate2)) return;
        if (Hexagon.tilesAdjacent(tile1, tile2) && !Hexagon.hasOverlap(tile1, tile2)) {
          const merged = Hexagon.merge(tiledata, tile1, tile2, Hexagon.translate(tile1, translate2));
          if (!Hexagon.hasHoles(merged)) {
            tessellations.push([translate1, translate2]);
            exclude1.add(translate2);
            exclude2.add(Hexagon.subtract(translate1, translate2));
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
        if (current.active_option === 'reset-tile-colors') {
          return {
            'hex-tessellate': {...current,
              active_option: null
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
