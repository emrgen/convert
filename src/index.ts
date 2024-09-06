import BigDecimal from 'js-big-decimal';
import {isString} from 'lodash';

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

const conditions = [
  {length: 1, mass: 0, time: 0, count: 0},
  {length: 0, mass: 1, time: 0, count: 0},
  {length: 0, mass: 0, time: 1, count: 0},
  {length: 0, mass: 0, time: 0, count: 1},
];

enum UnitType {
  LENGTH = 'length',
  MASS = 'mass',
  TIME = 'time',
  COUNT = 'count',
  TEMPERATURE = 'temperature',
}

export class Dimension {
  length: number
  mass: number
  time: number
  count: number
  temperature: number

  static NONE = new Dimension({length: 0, mass: 0, time: 0, count: 0, temperature: 0});

  static COUNT = new Dimension({length: 0, mass: 0, time: 0, count: 1, temperature: 0});
  static LENGTH = new Dimension({length: 1, mass: 0, time: 0, count: 0, temperature: 0});
  static MASS = new Dimension({length: 0, mass: 1, time: 0, count: 0, temperature: 0});
  static TIME = new Dimension({length: 0, mass: 0, time: 1, count: 0, temperature: 0});
  static TEMPERATURE = new Dimension({length: 0, mass: 0, time: 0, count: 0, temperature: 1});

  get isSimple() {
    return conditions.some(
      condition => (
        this.length === condition.length &&
        this.mass === condition.mass &&
        this.time === condition.time &&
        this.count === condition.count
      )
    );
  }

  get isComplex() {
    return !this.isSimple;
  }

  constructor(dim: { length: number, mass: number, time: number, count: number, temperature: number }) {
    this.length = dim.length ?? 0;
    this.mass = dim.mass ?? 0;
    this.time = dim.time ?? 0;
    this.count = dim.count ?? 0;
    this.temperature = dim.temperature ?? 0;
  }

  multiply(dim: Dimension) {
    return new Dimension({
      length: this.length + dim.length,
      mass: this.mass + dim.mass,
      time: this.time + dim.time,
      count: this.count + dim.count,
      temperature: this.temperature + dim.temperature,
    });
  }

  divide(dim: Dimension) {
    return new Dimension({
      length: this.length - dim.length,
      mass: this.mass - dim.mass,
      time: this.time - dim.time,
      count: this.count - dim.count,
      temperature: this.temperature + dim.temperature,
    });
  }

  pow(n: number) {
    return new Dimension({
      length: this.length * n,
      mass: this.mass * n,
      time: this.time * n,
      count: this.count * n,
      temperature: this.temperature * n,
    });
  }

  toString() {
    return `L${this.length}M${this.mass}T${this.time}C${this.count}`;
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

    const amount = fromBase.amount.multiply(factor).divide(toBase.amount)

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

  register(unit: Unit) {
    this.units.set(unit.id, unit);
    Unit.register(unit);

    if (unit.isBaseUnit()) {
      if (unit.dimension.length === 1) {
        this.bases.set(UnitType.LENGTH, unit);
      }
      if (unit.dimension.mass === 1) {
        this.bases.set(UnitType.MASS, unit);
      }
      if (unit.dimension.time === 1) {
        this.bases.set(UnitType.TIME, unit);
      }
      if (unit.dimension.count === 1) {
        this.bases.set(UnitType.COUNT, unit);
      }
    }

    unit.system = this;
  }

  constructor(name: string) {
    this.name = name;
    this.units = new Map();
    this.bases = new Map();
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
      let totalFactor = new BigDecimal(1);
      const {length, mass, time, count} = fromUint.dimension;
      if (mass !== 0) {
        // find the base unit for mass in the same system
        const fromBaseUnit = fromUint.system.bases.get(UnitType.MASS);
        const toBaseUnit = toUnit.system.bases.get(UnitType.MASS);

        let factor = Converter.convert(1, fromBaseUnit, toBaseUnit);
        let amount = new BigDecimal(1);
        for (let i = 0; i < Math.abs(mass); i++) {
          amount = amount.multiply(factor);
        }

        if (mass < 0) {
          amount = (new BigDecimal(1)).divide(amount);
        }

        totalFactor = totalFactor.multiply(amount);
      }

      if (length !== 0) {
        // find the base unit for length in the same system
        const fromBaseUnit = fromUint.system.bases.get(UnitType.LENGTH);
        const toBaseUnit = toUnit.system.bases.get(UnitType.LENGTH);

        let factor = Converter.convert(1, fromBaseUnit, toBaseUnit);
        let amount = new BigDecimal(1);
        for (let i = 0; i < Math.abs(length); i++) {
          amount = amount.multiply(factor);
        }

        if (length < 0) {
          amount = (new BigDecimal(1)).divide(amount);
        }

        totalFactor = totalFactor.multiply(amount);
      }

      if (time !== 0) {
        // find the base unit for time in the same system
        const fromBaseUnit = fromUint.system.bases.get(UnitType.TIME);
        const toBaseUnit = toUnit.system.bases.get(UnitType.TIME);

        let factor = Converter.convert(1, fromBaseUnit, toBaseUnit);
        let amount = new BigDecimal(1);
        for (let i = 0; i < Math.abs(time); i++) {
          amount = amount.multiply(factor);
        }

        if (time < 0) {
          amount = (new BigDecimal(1)).divide(amount);
        }

        totalFactor = totalFactor.multiply(amount);
      }

      return totalFactor;
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
    const gram = new Unit('g', 'gram', Dimension.MASS, kilogram);
    const milligram = new Unit('mg', 'milligram', Dimension.MASS, kilogram);
    const microgram = new Unit('µg', 'microgram', Dimension.MASS, kilogram);
    const nanogram = new Unit('ng', 'nanogram', Dimension.MASS, kilogram);

    System.METRIC.register(kilogram);
    System.METRIC.register(gram);
    System.METRIC.register(milligram);
    System.METRIC.register(microgram);
    System.METRIC.register(nanogram);

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