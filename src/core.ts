import BigDecimal from 'js-big-decimal';
import {entries, flatten, isString, reduce, sum} from 'lodash';

export class Quantity {
  amount: BigDecimal;
  unit: Unit;

  static create(amount: number | string, unit: Unit | string) {
    return new Quantity(amount, unit);
  }

  get value() {
    return this.amount.getValue();
  }

  constructor(amount: BigDecimal | number | string, unit?: Unit | string) {
    if (amount instanceof BigDecimal) {
      this.amount = amount;
    } else {
      this.amount = new BigDecimal(amount);
    }

    if (unit) {
      if (isString(unit)) {
        this.unit = Unit.units.get(unit as string);
        if (!this.unit) {
          throw new Error('Unknown unit');
        }
      } else {
        this.unit = unit as Unit;
      }
    }
  }

  // add(q: QuantityUnit): QuantityUnit {
  //   return new QuantityUnit();
  // }
  //
  // subtract(q: QuantityUnit): QuantityUnit {
  //   return new QuantityUnit();
  // }
  //
  // multiply(q: QuantityUnit): QuantityUnit {
  //   return new QuantityUnit();
  // }
  //
  // divide(q: QuantityUnit): QuantityUnit {
  //   return new QuantityUnit();
  // }
  //
  // equals(q: QuantityUnit): boolean {
  //   return false;
  // }

  round(precision: number) {
    return new Quantity(this.amount.round(precision), this.unit);
  }

  isSimilar(q: Quantity): boolean {
    return this.unit.isSimilar(q.unit);
  }

  to(to: Unit | string) {
    let toUnit: Unit = null;
    if (!this.unit) {
      throw new Error('No unit');
    }

    if (isString(to)) {
      toUnit = Unit.units.get(to as string);
      if (!toUnit) {
        throw new Error('Unknown unit');
      }
    } else {
      toUnit = to as Unit;
    }

    if (!this.unit.isSimilar(toUnit)) {
      throw new Error('Cannot to between different types');
    }

    const [fromBaseUnit, fromFactor, fromOffset] = this.unit.toBaseUnit();
    const [toBaseUnit, toFactor, toOffset] = toUnit.toBaseUnit();

    // convert this amount into its own chain's base unit (affine: value * factor + offset)
    let baseAmount = this.amount.multiply(fromFactor).add(fromOffset);

    // cross-system base units (e.g. meter <-> foot) are related by a registered ratio, not a chain
    if (!fromBaseUnit.eq(toBaseUnit)) {
      const crossFactor = Converter.convert(1, fromBaseUnit, toBaseUnit);
      baseAmount = baseAmount.multiply(crossFactor);
    }

    // invert the target chain's affine transform: base = value * factor + offset
    const amount = baseAmount.subtract(toOffset).divide(toFactor, 50);

    return new Quantity(amount, to)
  }

  in(to: Unit | string) {
    return this.to(to)
  }

  toBase() {
    const base = this.unit.toBase();
    return new Quantity(this.amount.multiply(base.amount), base.unit);
  }

  negate() {
    return new Quantity(this.amount.negate(), this.unit);
  }

  toString() {
    return `${this.amount.getValue()} ${this.unit.symbol}`;
  }
}



type UnitType = string;

export class Dimension {
  types: Record<string, number> = {}

  static NONE = new Dimension({});

  static COUNT = new Dimension({length: 0, mass: 0, time: 0, count: 1, temperature: 0});
  static LENGTH = new Dimension({length: 1, mass: 0, time: 0, count: 0, temperature: 0});
  static MASS = new Dimension({length: 0, mass: 1, time: 0, count: 0, temperature: 0});
  static TIME = new Dimension({length: 0, mass: 0, time: 1, count: 0, temperature: 0});
  static TEMPERATURE = new Dimension({length: 0, mass: 0, time: 0, count: 0, temperature: 1});

  static create(dim: Record<string, number>) {
    return new Dimension(dim);
  }

  entries() {
    return entries(this.types).filter(([_, value]) => value !== 0);
  }

  get isSimple() {
    const kv = this.entries();
    if (kv.length > 1) return false;
    return sum(kv.map(([_, value]) => value)) === 1;
  }

  get isComplex() {
    return !this.isSimple;
  }

  constructor(dim: Record<string, number>) {
    this.types = dim;
  }

  multiply(dim: Dimension) {
    const types = entries(this.types).reduce((acc, [key, value]) => {
      acc[key] = value + dim.types[key];
      return acc;
    }, {} as Record<string, number>);
    return new Dimension(types);
  }

  divide(dim: Dimension) {
    const types = entries(this.types).reduce((acc, [key, value]) => {
      acc[key] = value - dim.types[key];
      return acc;
    }, {} as Record<string, number>);
    return new Dimension(types);
  }

  pow(n: number) {
    const types = entries(this.types).reduce((acc, [key, value]) => {
      acc[key] = value * n;
      return acc;
    }, {} as Record<string, number>);
    return new Dimension(types);
  }

  toString() {
    return entries(this.types).map(([key, value]) => {
      if (value === 0) {
        return '';
      }
      return `${key}${value}`;
    }).join('');
  }
}

export class Unit {
  id: Symbol;
  symbol: string;
  name: string;
  system: System;
  baseUnit?: Unit;
  factor: BigDecimal;
  offset: BigDecimal;
  dimension: Dimension;

  static units: Map<string, Unit> = new Map();
  static sizes: Map<string, Map<Unit, number>> = new Map();

  constructor(symbol: string, name: string, dimension: Dimension, baseUnit?: Unit | string, factor: BigDecimal | number = 1, offset: BigDecimal | number = 0) {
    this.id = Symbol(symbol);
    this.symbol = symbol;
    this.name = name;
    let base = baseUnit;
    if (isString(baseUnit)) {
      base = Unit.units.get(baseUnit as string);
      if (!base) {
        throw new Error('Unknown unit, ' + baseUnit);
      }
    }

    this.baseUnit = base as Unit;

    this.dimension = dimension;

    if (factor instanceof BigDecimal) {
      this.factor = factor;
    } else {
      this.factor = new BigDecimal(factor);
    }

    if (offset instanceof BigDecimal) {
      this.offset = offset;
    } else {
      this.offset = new BigDecimal(offset);
    }
  }

  isBaseUnit() {
    return !this.baseUnit && this.dimension.isSimple;
  }

  static register(unit: Unit) {
    Unit.units.set(unit.symbol, unit);
    const origin = unit.toBase();

    const map = Unit.sizes.get(unit.symbol) ?? new Map();
    map.set(unit, origin.amount.getValue());
    Unit.sizes.set(unit.symbol, map);
  }

  get type() {
    return this.dimension.toString();
  }

  static compareBySize(a: Unit, b: Unit) {
    const aSize = Unit.sizes.get(a.symbol).get(a);
    const bSize = Unit.sizes.get(b.symbol).get(b);

    return aSize - bSize;
  }

  toBase() {
    const [unit, factor] = this.toBaseUnit();
    return new Quantity(factor, unit);
  }

  toBaseUnit(): [Unit, BigDecimal, BigDecimal] {
    if (!this.baseUnit) {
      return [this, this.factor, this.offset];
    }

    const [baseUnit, factor, offset] = this.baseUnit.toBaseUnit();
    return [baseUnit, factor.multiply(this.factor), offset.add(this.offset.multiply(factor))];
  }

  isSimilar(unit: Unit) {
    return this.type === unit.type;
  }

  eq(to: Unit) {
    return this.symbol === to.symbol;
  }

  toJSON() {
    return {
      symbol: this.symbol,
      name: this.name,
      type: this.type,
      factor: this.factor.getValue(),
      dimension: this.dimension.toString(),
    }
  }
}

// System of units (metric, imperial, etc)
export class System {
  name: string;

  units: Map<Symbol, Unit>;
  bases: Map<UnitType, Unit>;

  static METRIC = new System('Metric');
  static IMPERIAL = new System('Imperial');
  static Universal = new System('Universal');

  static get systems() {
    return [System.METRIC, System.IMPERIAL, System.Universal];
  }

  register(unit: Unit) {
    this.units.set(unit.id, unit);
    Unit.register(unit);

    if (unit.isBaseUnit()) {
      const kv = unit.dimension.entries();
      if (unit.dimension.isSimple) {
        if (kv.length === 1) {
          const [key] = kv[0];
          this.bases.set(key, unit);
        }
      }
    }

    unit.system = this;
  }

  constructor(name: string) {
    this.name = name;
    this.units = new Map();
    this.bases = new Map();
  }

  static similarUnits(unit: Unit|string) {
    return flatten(System.systems.map(system => system.similarUnits(unit)));
  }

  similarUnits(unit: Unit|string) {
    if (isString(unit)) {
      unit = Unit.units.get(unit as string);
      if (!unit) {
        throw new Error('Unknown unit');
      }
    }
    return Array.from(this.units.values()).filter(u => u.isSimilar(unit)).filter(u => u.id !== unit.id);
  }
}

export class Converter {
  static conversions: Map<Unit, Map<Unit, (q: BigDecimal) => BigDecimal>> = new Map();

  static register(from: Unit, to: Unit, factor: BigDecimal | string | number) {
    if (!from.isBaseUnit()) {
      throw new Error('Only base units can be registered');
    }

    const toFactor = () => {
      if (factor instanceof BigDecimal) {
        return factor
      } else {
        return new BigDecimal(factor)
      }
    }

    Converter.registerConversion(from, to, (q: BigDecimal) => q.multiply(toFactor()));
    Converter.registerConversion(to, from, (q: BigDecimal) => q.divide(toFactor()));
  }

  private static registerConversion(from: Unit, to: Unit, conversion: (q: BigDecimal) => BigDecimal) {
    const map: Map<Unit, ((q: BigDecimal) => BigDecimal)> = Converter.conversions.get(from) ?? new Map();
    map.set(to, conversion)
    Converter.conversions.set(from, map);
  }

  static convert(q: BigDecimal | string | number, from: Unit | string, to: Unit | string): BigDecimal {
    let toUnit: Unit = null;
    if (isString(to)) {
      toUnit = Unit.units.get(to as string)
      if (!toUnit) {
        throw new Error('Unknown unit');
      }
    } else {
      toUnit = to as Unit;
    }

    let fromUnit: Unit = null;
    if (isString(from)) {
      fromUnit = Unit.units.get(from as string)
      if (!fromUnit) {
        throw new Error('Unknown unit');
      }
    } else {
      fromUnit = from as Unit;
    }

    if (!fromUnit.isSimilar(toUnit)) {
      throw new Error('Cannot to between different types');
    }

    // console.log('from', fromUnit.toJSON());
    // console.log('to', toUnit.toJSON());
    // console.log('');

    if (fromUnit.eq(toUnit)) {
      return new BigDecimal(1);
    }

    if (fromUnit.dimension.isSimple && toUnit.dimension.isSimple) {
      const conversion = Converter.conversions.get(fromUnit).get(toUnit);

      let amount: BigDecimal;
      if (q instanceof BigDecimal) {
        amount = q;
      } else {
        amount = new BigDecimal(q);
      }

      if (conversion) {
        return conversion(amount);
      } else {
        throw new Error('No conversion available');
      }
    } else {
      // convert each dimension to base unit
      const kv = fromUnit.dimension.entries();

      return reduce(kv, (totalFactor, [dimensionName, dimensionValue]) => {
        if (dimensionValue === 0) {
          return totalFactor;
        }

        const fromBaseUnit = fromUnit.system.bases.get(dimensionName);
        const toBaseUnit = toUnit.system.bases.get(dimensionName);
        let factor = Converter.convert(1, fromBaseUnit, toBaseUnit);
        let amount = new BigDecimal(1);
        for (let i = 0; i < Math.abs(dimensionValue); i++) {
          amount = amount.multiply(factor);
        }

        if (dimensionValue < 0) {
          amount = (new BigDecimal(1)).divide(amount);
        }

        return totalFactor.multiply(amount);
      }, new BigDecimal(1));
    }
  }
}
