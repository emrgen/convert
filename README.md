# @emrgen/convert

Unit conversion library for JavaScript and TypeScript. It supports predefined units, arbitrary dimensions, high-precision decimal arithmetic, and custom units.

## Install

```bash
pnpm add @emrgen/convert
```

## Quick start

```ts
import {Quantity} from '@emrgen/convert';

const distance = Quantity.create(1, 'm');

console.log(distance.to('ft').round(2).value); // "3.28"
console.log(distance.toString()); // "1 meter"
```

`Quantity.create` accepts a number or decimal string. Unit names are used for lookup; conversion returns a new quantity and does not mutate the original.

```ts
const mass = Quantity.create('2.5', 'kg');

mass.to('lb').round(3).value; // "5.512"
mass.in('lb').value;           // alias for to()
mass.toBase().toString();      // base-unit quantity
mass.negate().value;           // "-2.5"
```

Use decimal strings when exact input matters. `round(precision)` returns a new quantity, and `value` returns the decimal value as a string.

## Predefined units

Units are available immediately after importing the package.

| Dimension | Units |
| --- | --- |
| Count | `count`, `pair`, `dozen`, `hundred`, `thousand`, `million`, `billion`, `trillion`, `quadrillion` |
| Length | `m`, `km`, `cm`, `mm`, `µm`, `nm`, `ft`, `in`, `yd`, `mi` |
| Mass | `kg`, `dag`, `hg`, `g`, `mig`, `µg`, `ng`, `t`, `q`, `lb`, `oz` |
| Time | `s`, `min`, `h`, `d`, `w`, `mo`, `y` |
| Temperature | `C`, `F`, `K` |
| Digital storage | `bit`, `B`, `KB`, `MB`, `GB`, `TB` |
| Angle | `deg`, `rad`, `grad` |
| Frequency | `Hz`, `kHz`, `MHz`, `GHz`, `rpm` |

Metric and imperial base conversions include meters/feet and kilograms/pounds. Derived dimensions can be built from registered base units.

## Custom units

Create a unit with `Unit`, then register it with a `System`.

```ts
import {Dimension, Quantity, System, Unit} from '@emrgen/convert';

const jaw = new Unit(
  'jaw',                 // symbol, used for lookup
  'jaw',                 // display name
  Dimension.LENGTH,
  'in',                  // base unit
  '0.25',                // 1 jaw = 0.25 inches
);

System.IMPERIAL.register(jaw);

Quantity.create(4, 'jaw').to('in').round(2).value; // "1.00"
```

For a new base-unit conversion, register both units and the conversion factor:

```ts
import {Converter, Dimension, System, Unit} from '@emrgen/convert';

const meter = new Unit('custom-m', 'custom-meter', Dimension.LENGTH);
const foot = new Unit('custom-ft', 'custom-foot', Dimension.LENGTH);

System.METRIC.register(meter);
System.IMPERIAL.register(foot);
Converter.register(meter, foot, '3.280839895');
```

`Converter.register(from, to, factor)` defines `1 from = factor to` and automatically registers the reverse conversion. Both units must be base units.

## Dimensions

Use built-in dimensions or compose custom ones:

```ts
const acceleration = Dimension.LENGTH.divide(Dimension.TIME.pow(2));
const area = Dimension.LENGTH.pow(2);
const force = Dimension.MASS.multiply(Dimension.LENGTH)
  .divide(Dimension.TIME.pow(2));
```

Available built-ins: `Dimension.NONE`, `COUNT`, `LENGTH`, `MASS`, `TIME`, and `TEMPERATURE`.

Quantities can convert only between similar dimensions. Temperature conversion is absolute (`0` `C` converts to `32` `F`, not `0`), via an `offset` on `Unit` — see below.

## Affine units (offset conversions)

Most units convert by a simple ratio (`base = value * factor`), but some — temperature is the built-in example — need an additive offset too (`base = value * factor + offset`). Pass `offset` as the sixth constructor argument:

```ts
const celsius = new Unit('C', 'celsius', Dimension.TEMPERATURE);
const fahrenheit = new Unit(
  'F', 'fahrenheit', Dimension.TEMPERATURE,
  celsius,        // base unit
  '0.5555555556', // factor
  '-17.77777778', // offset
);

Quantity.create(0, 'C').to('F').value; // "32"
```

## API

### `Quantity`

- `Quantity.create(amount, unit)`
- `quantity.to(unit)` / `quantity.in(unit)`
- `quantity.toBase()`
- `quantity.round(precision)`
- `quantity.negate()`
- `quantity.isSimilar(other)`
- `quantity.value` — decimal string
- `quantity.toString()` — value plus unit symbol

### `Unit`

- `new Unit(symbol, name, dimension, baseUnit?, factor?, offset?)`
- `Unit.register(unit)`
- `unit.toBase()`
- `unit.isSimilar(other)`
- `unit.isBaseUnit()`
- `unit.toJSON()`

### `System`

- `System.METRIC`
- `System.IMPERIAL`
- `System.Universal`
- `system.register(unit)`
- `system.similarUnits(unit)`
- `System.similarUnits(unit)`

### `Converter`

- `Converter.register(from, to, factor)`
- `Converter.convert(amount, from, to)`

## Development

```bash
pnpm install
pnpm test
pnpm run lint
```

## License

MIT
