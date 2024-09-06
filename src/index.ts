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
      if (!to) {
        throw new Error('Unknown unit');
      }
    } else {
      toUnit = to as Unit;
    }

    if (!this.unit.isSimilar(toUnit)) {
      throw new Error('Cannot to between different types');
    }

    const q = this.unit.to(toUnit)

    const amount = q.amount.multiply(this.amount)

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
  dimension: Dimension;

  static units: Map<string, Unit> = new Map();
  static sizes: Map<string, Map<Unit, number>> = new Map();

  constructor(name: string, symbol: string, dimension: Dimension, baseUnit?: Unit | string, factor: BigDecimal | number = 1) {
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
  }

  isBaseUnit() {
    return !this.baseUnit && this.dimension.isSimple;
  }

  static register(unit: Unit) {
    Unit.units.set(unit.name, unit);
    const origin = unit.toBase();

    const map = Unit.sizes.get(unit.name) ?? new Map();
    map.set(unit, origin.amount.getValue());
    Unit.sizes.set(unit.name, map);
  }

  get type() {
    return this.dimension.toString();
  }

  static compareBySize(a: Unit, b: Unit) {
    const aSize = Unit.sizes.get(a.name).get(a);
    const bSize = Unit.sizes.get(b.name).get(b);

    return aSize - bSize;
  }

  to(to: Unit): Quantity {
    if (!this.isSimilar(to)) {
      throw new Error('Cannot to between different types');
    }

    const fromBase = this.toBase()
    const toBase = to.toBase()

    // console.log('fromBase', fromBase, toBase)
    // covert 1 unit from source to target unit
    const factor = Converter.convert(1, fromBase.unit, toBase.unit);
    // console.log(fromBase.amount, factor, toBase.amount)
    const amount = fromBase.amount.multiply(factor).divide(toBase.amount, 50);

    return new Quantity(amount, to);
  }

  toBase() {
    const [unit, factor] = this.toBaseUnit();
    return new Quantity(factor, unit);
  }

  private toBaseUnit() {
    if (!this.baseUnit) {
      return [this, this.factor];
    }

    let [baseUnit, factor] = this.baseUnit.toBaseUnit()
    return [baseUnit, factor.multiply(this.factor)]
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
        if (entries.length === 1) {
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

    let fromUint: Unit = null;
    if (isString(from)) {
      fromUint = Unit.units.get(from as string)
      if (!fromUint) {
        throw new Error('Unknown unit');
      }
    } else {
      fromUint = from as Unit;
    }

    if (!fromUint.isSimilar(toUnit)) {
      throw new Error('Cannot to between different types');
    }

    // console.log('from', fromUint.toJSON());
    // console.log('to', toUnit.toJSON());
    // console.log('');

    if (fromUint.eq(toUnit)) {
      return new BigDecimal(1);
    }

    if (fromUint.dimension.isSimple && toUnit.dimension.isSimple) {
      const conversion = Converter.conversions.get(fromUint).get(toUnit);

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
      const kv = fromUint.dimension.entries();

      return reduce(kv, (totalFactor, [dimensionName, dimensionValue]) => {
        if (dimensionValue === 0) {
          return totalFactor;
        }

        const fromBaseUnit = fromUint.system.bases.get(dimensionName);
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

class Initializer {
  static create() {
    // UNIVERSAL SYSTEM

    // counts
    const count = new Unit('count', 'count', Dimension.COUNT);
    System.Universal.register(count);

    // times
    const second = new Unit('s', 'second', Dimension.TIME);

    // METRIC SYSTEM

    System.METRIC.register(second);

    // lengths
    const meter = new Unit('m', 'meter', Dimension.LENGTH);
    const kilometer = new Unit('km', 'kilometer', Dimension.LENGTH, meter, 1000);
    const centimeter = new Unit('cm', 'centimeter', Dimension.LENGTH, meter, 0.01);
    const millimeter = new Unit('mm', 'millimeter', Dimension.LENGTH, meter, 0.001);
    const micrometer = new Unit('µm', 'micrometer', Dimension.LENGTH, meter, 0.000001);
    const nanometer = new Unit('nm', 'nanometer', Dimension.LENGTH, meter, 0.000000001);

    System.METRIC.register(meter);
    System.METRIC.register(kilometer);
    System.METRIC.register(centimeter);
    System.METRIC.register(millimeter);
    System.METRIC.register(micrometer);
    System.METRIC.register(nanometer);

    // masses
    const kilogram = new Unit('kg', 'kilogram', Dimension.MASS);
    const decagram = new Unit('dag', 'decagram', Dimension.MASS, kilogram, 10);
    const hectogram = new Unit('hg', 'hectogram', Dimension.MASS, kilogram, 100);
    const gram = new Unit('g', 'gram', Dimension.MASS, kilogram, 0.001);
    const milligram = new Unit('mig', 'milligram', Dimension.MASS, kilogram, 0.000001);
    const microgram = new Unit('µg', 'microgram', Dimension.MASS, kilogram, 0.000000001);
    const nanogram = new Unit('ng', 'nanogram', Dimension.MASS, kilogram, 0.000000000001);

    const ton = new Unit('t', 'ton', Dimension.MASS, kilogram, 1000);
    const quintal = new Unit('q', 'quintal', Dimension.MASS, kilogram, 100);

    System.METRIC.register(kilogram);
    System.METRIC.register(decagram);
    System.METRIC.register(hectogram);
    System.METRIC.register(gram);
    System.METRIC.register(milligram);
    System.METRIC.register(microgram);
    System.METRIC.register(nanogram);
    System.METRIC.register(ton);
    System.METRIC.register(quintal);

    // counts
    const hundred = new Unit('hundred', 'hundred', Dimension.COUNT, count, 100);
    const thousand = new Unit('thousand', 'thousand', Dimension.COUNT, count, 1000);
    const million = new Unit('million', 'million', Dimension.COUNT, count, 1000000);
    const billion = new Unit('billion', 'billion', Dimension.COUNT, count, 1000000000);
    const trillion = new Unit('trillion', 'trillion', Dimension.COUNT, count, 1000000000000);
    const quadrillion = new Unit('quadrillion', 'quadrillion', Dimension.COUNT, count, 1000000000000000);

    System.METRIC.register(hundred);
    System.METRIC.register(thousand);
    System.METRIC.register(million);
    System.METRIC.register(billion);
    System.METRIC.register(trillion);
    System.METRIC.register(quadrillion);

    // IMPERIAL SYSTEM

    const foot = new Unit('ft', 'foot', Dimension.LENGTH);
    const inch = new Unit('in', 'inch', Dimension.LENGTH, foot, new BigDecimal("0.0833333333"));
    const yard = new Unit('yd', 'yard', Dimension.LENGTH, foot, 3);
    const mile = new Unit('mi', 'mile', Dimension.LENGTH, yard, 1760);

    System.IMPERIAL.register(inch);
    System.IMPERIAL.register(foot);
    System.IMPERIAL.register(yard);
    System.IMPERIAL.register(mile);

    // masses
    const pound = new Unit('lb', 'pound', Dimension.MASS);
    const ounce = new Unit('oz', 'ounce', Dimension.MASS, pound, new BigDecimal("0.0625"));

    System.IMPERIAL.register(pound);
    System.IMPERIAL.register(ounce);

    // time
    const minute = new Unit('min', 'minute', Dimension.TIME, second, 60);
    const hour = new Unit('h', 'hour', Dimension.TIME, second, 60 * 60);
    const day = new Unit('d', 'day', Dimension.TIME, hour, 24);
    const week = new Unit('w', 'week', Dimension.TIME, day, 7);
    const month = new Unit('mo', 'month', Dimension.TIME, day, 30);
    const year = new Unit('y', 'year', Dimension.TIME, day, 365);

    System.IMPERIAL.register(second);
    System.IMPERIAL.register(minute);
    System.IMPERIAL.register(hour);
    System.IMPERIAL.register(day);
    System.IMPERIAL.register(week);
    System.IMPERIAL.register(month);
    System.IMPERIAL.register(year);

    // counts
    const pair = new Unit('pair', 'pair', Dimension.COUNT, count, 2);
    const dozen = new Unit('doz', 'dozen', Dimension.COUNT, count, 12);

    System.IMPERIAL.register(pair);
    System.IMPERIAL.register(dozen);

    // conversions
    Converter.register(meter, foot, new BigDecimal("3.280840"));
    Converter.register(kilogram, pound, new BigDecimal("2.20462262"));
  }
}

Initializer.create();