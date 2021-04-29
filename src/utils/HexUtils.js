import Point, { PointMap, PointSet } from './Point';

export class HexPoint extends Point {
  static steps = Object.freeze([
    [1,0], [0,1], [-1,1], [-1,0], [0,-1], [1,-1]
  ].map(Object.freeze));

  step(i) { return this.add(HexPoint.steps[i]); }
  forEachAdjacent(callback) {
    for (let i = 0; i < 6; ++i) callback(this.step(i), i);
  }
  someAdjacent(test) {
    for (let i = 0; i < 6; ++i) if (test(this.step(i), i)) return true;
    return false;
  }
  everyAdjacent(test) {
    return this.someAdjacent(...args => !test(...args));
  }
  adjacentTo(other) {
    return this.someAdjacent(adj_point => adj_point.equals(other));
  }
};

class Component {
  static borderNode(point, edges) {
    let concavity = 0;
    let next = [];
    for (let i = 0, j = 5; i < 6; j = i++) {
      if (edges & (1<<i)) {
        if (edges & (1<<j)) ++concavity;
        else --concavity;
      } else if (edges & (1<<j)) next.push(point.step(i));
    }
    return {edges: edges, concavity: concavity, next: next};
  }
  constructor(start) {
    if (start instanceof Component) {
      this.points = new PointSet(start.points);
      this.borders = new Set();
      this.borders_by_point = new PointMap();
      start.borders.forEach(border => {
        let new_border = new PointMap(border);
        this.borders.add(new_border);
        if (start.perimeter === border) this.perimeter = new_border;
        new_border.forEach((_node, point) =>
          this.borders_by_point.set(point, new_border));
      });
    } else {
      this.points = new PointSet([start]);
      this.perimeter = new PointMap();
      this.borders = new Set([this.perimeter]);
      this.borders_by_point = new PointMap();
      start.forEachAdjacent((point, i) => {
        this.perimeter.set(point, Component.borderNode(point, 1<<(i+3)%6));
        this.borders_by_point.set(point, this.perimeter);
      });
    }
  }
  get size() { return this.points.size; }
  add(point) {
    let border = this.borders_by_point.get(point);
    if (!border) throw new Error("Can't add a non-adjacent point to this component");
    this.borders_by_point.delete(point);
    let node = border.get(point);
    border.delete(point);
    if (border.size) {
      for (let i = 0; i < 6; ++i) {
        if (node.edges & (1<<i)) continue;
        let adj_point = point.step(i);
        let edges = border.get(adj_point)?.edges ?? 0;
        if (!edges) this.borders_by_point.set(adj_point, border);
        border.set(adj_point, Component.borderNode(adj_point, edges | (1<<(i+3)%6)));
      }
    } else this.borders.delete(border);
    node.next.slice(1).forEach(start_point => this.splitBorder(border, start_point));
    this.points.add(point);
    return this;
  }
  delete(point) {
    if (!this.points.delete(point))
      throw new Error("Can't delete a point that's not in this component");
    let border = this.borders_by_point.get(point.step(5));
    let edges = border ? 0 : 1<<5;
    let to_split = [];
    let split_next = Boolean(border);
    let first_split = true;
    for (let i = 0, j = 5; i < 6; j = i++) {
      let adj_point = point.step(i);
      if (!this.has(adj_point)) {
        if (edges & (1<<j)) {
          let adj_border = this.borders_by_point.get(adj_point);
          if (!border) border = adj_border;
          if (adj_border !== border) {
            this.mergeBorder(adj_border, border);
            this.borders.delete(adj_border);
            if (this.perimeter === adj_border) this.perimeter = border;
          } else split_next = true;
        }
        let adj_edges = border.get(adj_point).edges & ~(1<<(i+3)%6);
        if (!adj_edges) {
          border.delete(adj_point);
          this.borders_by_point.delete(adj_point);
        } else border.set(adj_point, Component.borderNode(adj_point, adj_edges));
      } else {
        edges |= 1<<i;
        if (split_next) {
          if (first_split) first_split = false;
          else to_split.push(adj_point);
          split_next = false;
        }
      }
    }
    if (!edges) throw new Error("Can't delete the only point in this component");
    if (!border) {
      border = new PointMap();
      this.borders.add(border);
    }
    border.set(point, Component.borderNode(point, edges));
    this.borders_by_point.set(point, border);
    return to_split.map(start_point => this.split(border, start_point));
  }
  has(point) { return this.points.has(point); }
  [Symbol.iterator]() { return this.points[Symbol.iterator](); }
  forEach(...args) { return this.points.forEach(...args); }
  translate(translation) {
    let new_component = Object.create(Component.prototype);
    new_component.points = new PointSet();
    this.points.forEach(point => new_component.points.add(point.add(translation)));
    new_component.borders = new Set();
    new_component.borders_by_point = new PointMap();
    this.borders.forEach(border => {
      let new_border = new PointMap();
      new_component.borders.add(new_border);
      if (this.perimeter === border) new_component.perimeter = new_border;
      border.forEach((node, point) => {
        point = point.add(translation);
        new_border.set(point, Component.borderNode(point, node.edges));
        new_component.borders_by_point.set(point, new_border);
      });
    });
    return new_component;
  }
  splitBorder(src, start_point) {
    let dest = new PointMap();
    this.borders.add(dest);
    let concavity = 0;
    const explore = point => {
      let node = src.get(point);
      if (node) {
        src.delete(point);
        dest.set(point, node);
        this.borders_by_point.set(point, dest);
        concavity += node.concavity;
        node.next.forEach(explore);
      }
    }
    explore(start_point);
    if (concavity < 0) this.perimeter = dest;
    return dest;
  }
  mergeBorder(src, dest) {
    src.forEach((node, point) => {
      let old_edges = dest.get(point)?.edges;
      if (old_edges) node = Component.borderNode(point, old_edges | node.edges);
      dest.set(point, node);
      this.borders_by_point.set(point, dest);
    });
  }
  split(border, start_point) {
    let dest = Object.create(Component.prototype);
    let new_border = new PointMap();
    dest.points = new PointSet();
    dest.borders = new Set([new_border]);
    dest.borders_by_point = new PointMap();
    const explore = point => {
      if (this.points.delete(point)) {
        dest.points.add(point);
        point.forEachAdjacent((adj_point, i) => {
          let adj_border = this.borders_by_point.get(adj_point);
          if (adj_border) {
            if (adj_border !== border) {
              this.borders.delete(adj_border);
              dest.borders.add(adj_border);
              for (let point of adj_border.keys()) {
                this.borders_by_point.delete(point);
                dest.borders_by_point.set(point, adj_border);
              }
            } else new_border.set(adj_point,
              (new_border.get(adj_point) ?? 0) | (1<<(i+3)%6));
          } else explore(adj_point);
        });
      }
    }
    explore(start_point);
    let concavity = 0;
    new_border.forEach((edges, point) => {
      let old_edges = border.get(point).edges & ~edges;
      if (!old_edges) {
        border.delete(point);
        this.borders_by_point.delete(point);
      } else border.set(point, Component.borderNode(point, old_edges));
      let node = Component.borderNode(point, edges);
      concavity += node.concavity;
      new_border.set(point, node);
      dest.borders_by_point.set(point, new_border);
    });
    if (concavity > 0) {
      dest.perimeter = this.perimeter;
      this.perimeter = border;
    } else dest.perimeter = new_border;
    return dest;
  }
  merge(src, start_point) {
    let src_border = src.borders_by_point.get(start_point);
    let merged_border;
    let to_split = [];
    let split_next = src.has(start_point.step(5));
    let first_split = true;
    for (let i = 0; i < 6; ++i) {
      let adj_point = start_point.step(i);
      if (src.has(adj_point)) {
        if (!merged_border) {
          merged_border = this.borders_by_point.get(adj_point);
          this.mergeBorder(src_border, merged_border);
          merged_border.delete(start_point);
          this.borders_by_point.delete(start_point);
        }
        merged_border.delete(adj_point);
        this.borders_by_point.delete(adj_point);
        split_next = true;
      } else if (split_next) {
        if (first_split) first_split = false;
        else to_split.push(adj_point);
        split_next = false;
      }
    }
    src.forEach(point => this.points.add(point));
    src.borders.forEach(border => {
      if (border !== src_border) {
        let is_perimeter = border === src.perimeter;
        border = new PointMap(border);
        if (is_perimeter) this.perimeter = border;
        this.borders.add(border);
        for (let point of border.keys())
          this.borders_by_point.set(point, border);
      }
    });
    to_split.forEach(start_point => this.splitBorder(merged_border, start_point));
  }
}

const edges = Symbol('edges');
const adjacent = Symbol('adjacent');
const components = Symbol('components');
const components_by_point = Symbol('components_by_point');
const trace_border = Symbol('trace-border');

export class HexTile extends PointMap {
  constructor(entries) {
    if (entries instanceof HexTile) {
      super(entries);
      this[edges] = new PointMap(entries[edges]);
      this[adjacent] = new PointMap(entries[adjacent]);
      this[components] = new Set();
      this[components_by_point] = new PointMap();
      entries[components].forEach(component => {
        component = new Component(component);
        this[components].add(component);
        component.forEach(point => this[components_by_point].set(point, component));
      });
    } else {
      super();
      this[edges] = new PointMap();
      this[adjacent] = new PointMap();
      this[components] = new Set();
      this[components_by_point] = new PointMap();
      if (entries) for (let entry of entries) this.set(...entry);
    }
  }
  clear() {
    super.clear();
    this[edges].clear();
    this[adjacent].clear();
    this[components].clear();
    this[components_by_point].clear();
  }
  delete(point) {
    if (super.delete(point)) {
      this[edges].delete(point);
      let new_edges = 0;
      point.forEachAdjacent((adj_point, i) => {
        if (!this.has(adj_point)) {
          let adj_edges = this[adjacent].get(adj_point) & ~(1<<(i+3)%6);
          if (!adj_edges) this[adjacent].delete(adj_point);
          else this[adjacent].set(adj_point, adj_edges);
        } else {
          new_edges |= 1<<i;
          this[edges].set(adj_point,
            (this[edges].get(adj_point) ?? 0) | (1<<(i+3)%6));
        }
      });
      let component = this[components_by_point].get(point);
      this[components_by_point].delete(point);
      if (new_edges) {
        this[adjacent].set(point, new_edges);
        component.delete(point).forEach(new_component => {
          this[components].add(new_component);
          new_component.forEach(point =>
            this[components_by_point].set(point, new_component));
        });
      } else this[components].delete(component);
      return true;
    } else return false;
  }
  set(point, data) {
    if (!this.has(point)) {
      this[adjacent].delete(point);
      let new_edges = 0;
      let component;
      point.forEachAdjacent((adj_point, i) => {
        let adj_edges = this[edges].get(adj_point) & ~(1<<(i+3)%6);
        if (!adj_edges) this[edges].delete(adj_point);
        else this[edges].set(adj_point, adj_edges);
        let adj_component = this[components_by_point].get(adj_point);
        if (adj_component) {
          if (!component) {
            component = adj_component;
            component.add(point);
          } else if (adj_component !== component) {
            component.merge(adj_component, point);
            this[components].delete(adj_component);
            for (let point of adj_component)
              this[components_by_point].set(point, component);
          }
        } else {
          new_edges |= 1<<i;
          this[adjacent].set(adj_point,
            (this[adjacent].get(adj_point) ?? 0) | (1<<(i+3)%6));
        }
      });
      if (new_edges) this[edges].set(point, new_edges);
      if (!component) {
        component = new Component(point);
        this[components].add(component);
      }
      this[components_by_point].set(point, component);
    }
    super.set(point, data);
  }
  [trace_border](border) {
    let [start_point, start_node] = border.entries().next().value;
    let start_edge = 0;
    while (!((1<<start_edge) & start_node.edges)) ++start_edge;
    start_point = start_point.step(start_edge);
    start_edge = (start_edge+3)%6;
    let trace = [];
    let point = start_point,
      current_edges = this[edges].get(start_point),
      i = start_edge;
    do {
      trace.push([point, i]);
      i = (i+1)%6;
      if (!(current_edges & (1<<i))) {
        point = point.step(i);
        current_edges = this[edges].get(point);
        i = (i+4)%6;
      }
    } while (!point.equals(start_point) || i !== start_edge);
    return trace;
  }
  overlaps(other) {
    for (let point of this.keys()) {
      if (other.has(point)) return true;
    }
    return false;
  }
  adjacentTo(other) {
    for (let point of this[adjacent].keys()) {
      if (other.has(point)) return true;
    }
    return false;
  }
  translate(translation, shallow=false) {
    if (shallow) {
      let new_tile = new PointSet();
      for (let point of this.keys()) new_tile.add(point.add(translation));
      return new_tile;
    }
    let new_tile = new this.constructor();
    this.forEach((value, point) => super.set.call(new_tile, point.add(translation), value));
    this[edges].forEach((value, point) => new_tile[edges].set(point.add(translation), value));
    this[adjacent].forEach((value, point) =>
      new_tile[adjacent].set(point.add(translation), value));
    this[components].forEach(component => {
      component = component.translate(translation);
      new_tile[components].add(component);
      component.forEach(point => new_tile[components_by_point].set(point, component));
    })
    return new_tile;
  }
  getComponent(start) {
    let component = this[components_by_point].get(start);
    if (!component) throw new Error('Improper usage: tile must contain starting point');
    let new_tile = new this.constructor();
    let new_component = new Component(component);
    new_tile[components].add(new_component);
    new_component.forEach(point => {
      super.set.call(new_tile, point, this.get(point));
      new_tile[components_by_point].set(point, new_component);
      let current_edges = this[edges].get(point);
      if (current_edges) new_tile[edges].set(point, current_edges);
    });
    new_component.borders.forEach(border => border.forEach((node, point) =>
      new_tile[adjacent].set(point, node.edges)));
    return new_tile;
  }
  merge(other) {
    if (this.overlaps(other))
      throw new Error('Improper usage: merged tile cannot overlap this one');
    other.forEach((value, point) => this.set(point, value));
    return this;
  }
  edges() {
    return this[edges].keys();
  }
  adjacent() {
    return this[adjacent].keys();
  }
  isConnected() {
    return this[components].size === 1;
  }
  perimeter() {
    if (!this.isConnected())
      throw new Error('Improper usage: perimeter() must operate on a connected tile');
    return this[trace_border](this[components].values().next().value.perimeter);
  }
  holes() {
    if (!this.isConnected()) {
      throw new Error('Improper usage: holes() must operate on a connected tile');
    }
    let holes = [];
    let component = this[components].values().next().value;
    component.borders.forEach(border => {
      if (component.perimeter !== border) holes.push(this[trace_border](border));
    });
    return holes;
  }
};
