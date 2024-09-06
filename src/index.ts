import BigDecimal from 'js-big-decimal';
import { isString } from 'lodash';

export class Quantity {
  system: UnitSystem;
  type: UnitType;
  mixed: QuantityUnit[] = []

  constructor(system: UnitSystem, type: UnitType, mixed: QuantityUnit[]) {
    this.system = system;
    this.type = type;
    this.mixed = mixed;
  }

  static create(amount: number | string, unit: Unit | string) {
    let toUnit: Unit = null;
    if (isString(unit)) {
      toUnit = Unit.units.get(unit as string)
      if (!toUnit) {
        throw new Error('Unknown unit');
      }
    } else {
      toUnit = unit as Unit;
    }

    return new Quantity(toUnit.system, toUnit.type, [new QuantityUnit(amount, unit)]);
  }

  add(q: Quantity): Quantity {
    if (this.type !== q.type) {
      throw new Error('Cannot add different types');
    }

    // if the system is the same then we can add
    if (this.system == q.system) {
      const selfBase = this.toBase();
      const qBase = q.toBase();

      const amount = selfBase.mixed[0].amount.add(qBase.mixed[0].amount);

      return new Quantity(this.system, this.type, [new QuantityUnit(amount, selfBase.mixed[0].unit)]).simplify();
    } else {
      const qBase = q.toBase();
      const qAmount = this.mixed[0].amount;
      const qBaseUnit = this.mixed[0].unit;

      const selfBase = this.toBase();
      const selfAmount = selfBase.mixed[0].amount;
      const selfBaseUnit = selfBase.mixed[0].unit;

      const amount = qBaseUnit.to(selfBaseUnit).amount.add(selfAmount);

      return new Quantity(this.system, this.type, [new QuantityUnit(amount, selfBaseUnit)]).simplify()
    }
  }

  subtract(q: Quantity): Quantity {
    return this.add(q.negate());
  }

  negate() {
    const mixed = this.mixed.map(q => q.negate());
    return new Quantity(this.system, this.type, mixed);
  }

  toBase() {
    const mixed = this.mixed.map(q => q.toBase()).map(q => q.amount);
    const total = mixed.reduce((acc, q) => acc.add(q), new BigDecimal(0));
    return new Quantity(this.system, this.type, [new QuantityUnit(total)]);
  }

  simplify() {
    return this;
  }
}

export class QuantityUnit {
  amount: BigDecimal;
  unit: Unit;

  static create(amount: number | string, unit: Unit | string) {
    return new QuantityUnit(amount, unit);
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

  // add(q: Quantity): Quantity {
  //   return new Quantity();
  // }
  //
  // subtract(q: Quantity): Quantity {
  //   return new Quantity();
  // }
  //
  // multiply(q: Quantity): Quantity {
  //   return new Quantity();
  // }
  //
  // divide(q: Quantity): Quantity {
  //   return new Quantity();
  // }
  //
  // equals(q: Quantity): boolean {
  //   return false;
  // }

  round(precision: number) {
    return new QuantityUnit(this.amount.round(precision), this.unit);
  }

  isSimilar(q: QuantityUnit): boolean {
    return this.unit.isSimilar(q.unit);
  }

  compareTo(q: Quantity): number {
    return 0;
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

    return new QuantityUnit(amount, to)
  }

  in(to: Unit | string) {
    return this.to(to)
  }

  toBase() {
    const base = this.unit.toBase();
    return new QuantityUnit(this.amount.multiply(base.amount), base.unit);
  }

  negate() {
    return new QuantityUnit(this.amount.negate(), this.unit);
  }
}

enum UnitType {
  COUNT = 'count',
  LENGTH = 'length',
  MASS = 'mass',
  TIME = 'time',
}

export class Unit {
  id: Symbol;
  symbol: string;
  name: string;
  type: UnitType;
  system: UnitSystem;
  baseUnit?: Unit;
  factor: BigDecimal;

  static units: Map<string, Unit> = new Map();
  static sizes: Map<UnitType, Map<Unit, number>> = new Map();

  constructor(symbol: string, name: string, type: UnitType, baseUnit?: Unit, factor: BigDecimal | number = 1) {
    this.id = Symbol(symbol);
    this.symbol = symbol;
    this.name = name;
    this.type = type;
    this.baseUnit = baseUnit;

    if (factor instanceof BigDecimal) {
      this.factor = factor;
    } else {
      this.factor = new BigDecimal(factor);
    }
  }

  static create(symbol: string, name: string, type: UnitType, baseUnit?: Unit, factor: number = 1) {
    return new Unit(symbol, name, type, baseUnit, factor);
  }

  isBaseUnit() {
    return !this.baseUnit
  }

  static register(unit: Unit) {
    Unit.units.set(unit.symbol, unit);
    const origin = unit.toBase();

    const map = Unit.sizes.get(unit.type) ?? new Map();
    map.set(unit, origin.amount.getValue());
    Unit.sizes.set(unit.type, map);
  }

  static compareBySize(a: Unit, b: Unit) {
    const aSize = Unit.sizes.get(a.type).get(a);
    const bSize = Unit.sizes.get(b.type).get(b);

    return aSize - bSize;
  }

  to(to: Unit): QuantityUnit {
    if (!this.isSimilar(to)) {
      throw new Error('Cannot to between different types');
    }

    const fromBase = this.toBase()
    const toBase = to.toBase()

    const factor = UnitConverter.convert(1, fromBase.unit, toBase.unit);

    const amount = fromBase.amount.multiply(factor).divide(toBase.amount)

    return new QuantityUnit(amount, to);
  }

  toBase() {
    const [unit, factor] = this.toBaseUnit();
    return new QuantityUnit(factor, unit);
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
    }
  }
}

export class UnitSystem {
  name: string;

  units: Map<Symbol, Unit>;

  static METRIC = new UnitSystem('Metric');
  static IMPERIAL = new UnitSystem('Imperial');
  static Universal = new UnitSystem('Universal');

  register(unit: Unit) {
    this.units.set(unit.id, unit);
    Unit.register(unit);
    unit.system = this;
  }

  constructor(name: string) {
    this.name = name;
    this.units = new Map();
  }
}

export class UnitConverter {
  static conversions: Map<Unit, Map<Unit, (q: BigDecimal) => BigDecimal>> = new Map();

  static register(from: Unit, to: Unit, factor: BigDecimal| string | number) {
    if (!from.isBaseUnit()) {
      throw new Error('Only base units can be registered');
    }

    if (!to.isBaseUnit()) {
      throw new Error('Only base units can be registered');
    }

    const toFactor = () => {
      if (factor instanceof BigDecimal) {
        return factor
      } else {
        return new BigDecimal(factor)
      }
    }

    UnitConverter.registerConversion(from, to, (q: BigDecimal) => q.multiply(toFactor()));
    UnitConverter.registerConversion(to, from, (q: BigDecimal) => q.divide(toFactor()));
  }

  private static registerConversion(from: Unit, to: Unit, conversion: (q: BigDecimal) => BigDecimal) {
    const map: Map<Unit, ((q: BigDecimal) => BigDecimal)> = UnitConverter.conversions.get(from) ?? new Map();
    map.set(to, conversion)
    UnitConverter.conversions.set(from, map);
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

    const conversion = UnitConverter.conversions.get(fromUint).get(toUnit);

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
  }
}

class Initializer {
  static create() {
    // UNIVERSAL SYSTEM

    // counts
    const count = new Unit('count', 'count', UnitType.COUNT);
    UnitSystem.Universal.register(count);

    // times
    const second = new Unit('s', 'second', UnitType.TIME);

    // METRIC SYSTEM

    // lengths
    const meter = new Unit('m', 'meter', UnitType.LENGTH);
    const kilometer = new Unit('km', 'kilometer', UnitType.LENGTH, meter, 1000);
    const centimeter = new Unit('cm', 'centimeter', UnitType.LENGTH, meter, 0.01);
    const millimeter = new Unit('mm', 'millimeter', UnitType.LENGTH, meter, 0.001);
    const micrometer = new Unit('µm', 'micrometer', UnitType.LENGTH, meter, 0.000001);
    const nanometer = new Unit('nm', 'nanometer', UnitType.LENGTH, meter, 0.000000001);

    UnitSystem.METRIC.register(meter);
    UnitSystem.METRIC.register(kilometer);
    UnitSystem.METRIC.register(centimeter);
    UnitSystem.METRIC.register(millimeter);
    UnitSystem.METRIC.register(micrometer);
    UnitSystem.METRIC.register(nanometer);

    // masses
    const kilogram = new Unit('kg', 'kilogram', UnitType.MASS);
    const gram = new Unit('g', 'gram', UnitType.MASS, kilogram);
    const milligram = new Unit('mg', 'milligram', UnitType.MASS, kilogram);
    const microgram = new Unit('µg', 'microgram', UnitType.MASS, kilogram);
    const nanogram = new Unit('ng', 'nanogram', UnitType.MASS, kilogram);

    UnitSystem.METRIC.register(kilogram);
    UnitSystem.METRIC.register(gram);
    UnitSystem.METRIC.register(milligram);
    UnitSystem.METRIC.register(microgram);
    UnitSystem.METRIC.register(nanogram);


    // counts
    const hundred = new Unit('hundred', 'hundred', UnitType.COUNT, count, 100);
    const thousand = new Unit('thousand', 'thousand', UnitType.COUNT, count, 1000);
    const million = new Unit('million', 'million', UnitType.COUNT, count, 1000000);
    const billion = new Unit('billion', 'billion', UnitType.COUNT, count, 1000000000);
    const trillion = new Unit('trillion', 'trillion', UnitType.COUNT, count, 1000000000000);
    const quadrillion = new Unit('quadrillion', 'quadrillion', UnitType.COUNT, count, 1000000000000000);

    UnitSystem.METRIC.register(hundred);
    UnitSystem.METRIC.register(thousand);
    UnitSystem.METRIC.register(million);
    UnitSystem.METRIC.register(billion);
    UnitSystem.METRIC.register(trillion);
    UnitSystem.METRIC.register(quadrillion);

    // IMPERIAL SYSTEM

    const inch = new Unit('in', 'inch', UnitType.LENGTH);
    const foot = new Unit('ft', 'foot', UnitType.LENGTH, inch, 12);
    const yard = new Unit('yd', 'yard', UnitType.LENGTH, foot, 3);
    const mile = new Unit('mi', 'mile', UnitType.LENGTH, yard, 1760);

    UnitSystem.IMPERIAL.register(inch);
    UnitSystem.IMPERIAL.register(foot);
    UnitSystem.IMPERIAL.register(yard);
    UnitSystem.IMPERIAL.register(mile);

    // masses
    const pound = new Unit('lb', 'pound', UnitType.MASS);
    const ounce = new Unit('oz', 'ounce', UnitType.MASS, pound, new BigDecimal("0.0625"));

    UnitSystem.IMPERIAL.register(pound);
    UnitSystem.IMPERIAL.register(ounce);

    // time
    const minute = new Unit('min', 'minute', UnitType.TIME, second, 60);
    const hour = new Unit('h', 'hour', UnitType.TIME, second, 60*60);
    const day = new Unit('d', 'day', UnitType.TIME, hour, 24);
    const week = new Unit('w', 'week', UnitType.TIME, day, 7);
    const month = new Unit('mo', 'month', UnitType.TIME, day, 30);
    const year = new Unit('y', 'year', UnitType.TIME, day, 365);

    UnitSystem.IMPERIAL.register(second);
    UnitSystem.IMPERIAL.register(minute);
    UnitSystem.IMPERIAL.register(hour);
    UnitSystem.IMPERIAL.register(day);
    UnitSystem.IMPERIAL.register(week);
    UnitSystem.IMPERIAL.register(month);
    UnitSystem.IMPERIAL.register(year);

    // counts
    const pair = new Unit('pair', 'pair', UnitType.COUNT, count, 2);
    const dozen = new Unit('doz', 'dozen', UnitType.COUNT, count, 12);

    UnitSystem.IMPERIAL.register(pair);
    UnitSystem.IMPERIAL.register(dozen);


    // conversions
    UnitConverter.register(meter, inch, new BigDecimal("39.3700787"));
    UnitConverter.register(kilogram, pound, new BigDecimal("2.20462"));
  }
}

Initializer.create();