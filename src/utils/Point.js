import { deepEqual, add, divide, floor, ceil, multiply, subtract } from "mathjs";
import CustomMap from "./CustomMap";
import CustomSet from "./CustomSet";

class Point extends Array {
  static equal(p1, p2) { return deepEqual(p1, p2); }
  constructor(...coords) {
    super(...coords);
    this.key = super.toString();
    Object.freeze(this);
  }
  toString() { return this.key; }
  equals(other) { return other instanceof Point && Point.equal(this, other); }
  add(other) { return new this.constructor(...add(this, other)); }
  subtract(other) { return new this.constructor(...subtract(this, other)); }
  multiply(other) { return new this.constructor(...multiply(this, other)); }
  divide(other) { return new this.constructor(...divide(this, other)); }
  floor() { return new this.constructor(...floor([...this])); }
  ceil() { return new this.constructor(...ceil([...this])); }
}

const hashFn = point => point.key;

export class PointMap extends CustomMap {
  constructor(entries) {
    super(entries, hashFn);
  }
}

export class PointSet extends CustomSet {
  constructor(entries) {
    super(entries, hashFn);
  }
}

export default Point;
