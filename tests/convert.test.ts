import {expect, test} from 'vitest'
import {Dimension, Quantity, Unit, Converter, System} from "../src";
import BigDecimal from "js-big-decimal";

test('custom length unit', () => {
  const jaw = new Unit('jaw', 'jaw', Dimension.LENGTH, 'in', new BigDecimal("0.25"));
  const suto = new Unit('suto', 'suto', Dimension.LENGTH, 'in', new BigDecimal("0.015625"));

  System.IMPERIAL.register(jaw);
  System.IMPERIAL.register(suto);

  let jaw1 = Quantity.create(1, 'jaw');
  let suto1 = Quantity.create(1, 'suto');
  let inch1 = Quantity.create(1, 'in');

  expect(jaw1.to('in').round(5).value).toBe("0.25000");
  expect(suto1.to('in').round(5).value).toBe("0.01562");
  expect(inch1.to('suto').round(5).value).toBe("64.00000");
  expect(inch1.to('jaw').round(5).value).toBe("4.00000");

  // System.systems.forEach(s => s.similarUnits('in').forEach(unit => {
  //   console.log(unit.name);
  // }));
});

test('unit of volume', () => {
  const cubicMeter = new Unit('m3', 'cubic-meter', Dimension.LENGTH.pow(3));
  System.METRIC.register(cubicMeter);
  const cubicFoot = new Unit('ft3', 'cubic-foot', Dimension.LENGTH.pow(3));
  System.IMPERIAL.register(cubicFoot);

  const liter = new Unit('L', 'liter', Dimension.LENGTH.pow(3), cubicMeter, new BigDecimal("0.001"));
  const gallon = new Unit('gal', 'gallon', Dimension.LENGTH.pow(3), liter, new BigDecimal("3.78541"));

  System.METRIC.register(liter);
  System.IMPERIAL.register(gallon);

  let m3 = Quantity.create(1, 'm3');
  let ft3 = Quantity.create(1, 'ft3');
  let l1 = Quantity.create(1, 'L');
  let gal1 = Quantity.create(1, 'gal');

  expect(m3.to('ft3').round(5).value).toBe("35.31467");
  expect(ft3.to('m3').round(5).value).toBe("0.02832");
  expect(l1.to('gal').round(5).value).toBe("0.26417");
  expect(gal1.to('L').round(5).value).toBe("3.78541");
  expect(l1.to('m3').round(5).value).toBe("0.00100");
  expect(gal1.to('ft3').round(5).value).toBe("0.13368");
  expect(l1.to('ft3').round(5).value).toBe("0.03531");
})

test('ft to meter', () => {
  let m1 = Quantity.create(1, 'm');
  let km1 = Quantity.create(1, 'km');
  let yd1 = Quantity.create(1, 'yd');
  let f1 = Quantity.create(1, 'ft');
  let i1 = Quantity.create(1, 'in');
  let mile1 = Quantity.create(1, 'mi');

  let kg1 = Quantity.create(1, 'kg');
  let pound1 = Quantity.create(1, 'lb');
  let ounce1 = Quantity.create(1, 'oz');


  let m90 = Quantity.create(90, 'm');

  expect(m90.in('yd').round(5).value).toBe("98.42520");

  expect(m1.in('yd').round(5).value).toBe("1.09361");
  expect(m1.to('ft').round(5).value).toBe("3.28084");
  expect(m1.to('in').round(5).value).toBe("39.37008");
  expect(m1.to('mi').round(5).value).toBe("0.00062");
  expect(m1.to('km').round(5).value).toBe("0.00100");
  expect(m1.to('m').round(5).value).toBe("1.00000");

  expect(km1.to('ft').round(5).value).toBe("3280.84000");
  expect(km1.to('in').round(5).value).toBe("39370.08002");
  expect(km1.to('mi').round(5).value).toBe("0.62137");
  expect(km1.to('km').round(5).value).toBe("1.00000");
  expect(km1.to('m').round(5).value).toBe("1000.00000");

  expect(yd1.to('ft').round(5).value).toBe("3.00000");
  expect(yd1.to('in').round(5).value).toBe("36.00000");
  expect(yd1.to('mi').round(5).value).toBe("0.00057");
  expect(yd1.to('km').round(5).value).toBe("0.00091");
  expect(yd1.to('m').round(5).value).toBe("0.91440");

  expect(f1.to('ft').round(5).value).toBe("1.00000");
  expect(f1.to('in').round(5).value).toBe("12.00000");
  expect(f1.to('mi').round(5).value).toBe("0.00019");
  expect(f1.to('km').round(5).value).toBe("0.00030");
  expect(f1.to('m').round(5).value).toBe("0.30480");

  expect(i1.to('ft').round(5).value).toBe("0.08333");
  expect(i1.to('in').round(5).value).toBe("1.00000");
  expect(i1.to('mi').round(5).value).toBe("0.00002");
  expect(i1.to('km').round(5).value).toBe("0.00003");

  expect(mile1.to('ft').round(5).value).toBe("5280.00000");
  expect(mile1.to('in').round(5).value).toBe("63360.00003");
  expect(mile1.to('mi').round(5).value).toBe("1.00000");
  expect(mile1.to('km').round(5).value).toBe("1.60934");

  expect(kg1.to('lb').round(5).value).toBe("2.20462");
  expect(pound1.to('kg').round(5).value).toBe("0.45359");

  // matching upto 4 decimal places
  expect(kg1.to('oz').round(4).value).toBe("35.2740");

  expect(pound1.to('oz').round(5).value).toBe("16.00000");
});

test('create unit of force', () => {
  const forceDimension = Dimension.MASS.multiply(Dimension.LENGTH).divide(Dimension.TIME.pow(2));
  const newton = new Unit('N', 'newton', forceDimension);
  System.METRIC.register(newton);

  const lbfu = new Unit('lbf', 'pound-force-unit', forceDimension);
  System.IMPERIAL.register(lbfu);

  const lbf = new Unit('lbf', 'pound-force', forceDimension, lbfu, new BigDecimal("32.174049"));
  System.IMPERIAL.register(lbf);

  let n1 = Quantity.create(1, 'N');
  let lbf1 = Quantity.create(1, 'lbf');

  expect(n1.to('lbf').round(5).value).toBe("0.22481");
  expect(lbf1.to('N').round(5).value).toBe("4.44822");
});

test('create unit of pressure', () => {
  const pressureDimension = Dimension.MASS.divide(Dimension.LENGTH).divide(Dimension.TIME.pow(2));
  const pascal = new Unit('Pa', 'pascal', pressureDimension);
  System.METRIC.register(pascal);

  const psf = new Unit('psf', 'pound-force-per-square-foot', pressureDimension);
  System.IMPERIAL.register(psf);

  const psi = new Unit('psi', 'pound-force-per-square-inch', pressureDimension, psf, new BigDecimal("4633.06306"));
  System.IMPERIAL.register(psi);

  const atm = new Unit('atm', 'atmosphere', pressureDimension, pascal, new BigDecimal("101325"));
  System.METRIC.register(atm);

  let pa1 = Quantity.create(1, 'Pa');
  let psi1 = Quantity.create(1, 'psi');
  let atm1 = Quantity.create(1, 'atm');

  expect(pa1.to('psi').round(5).value).toBe("0.00015");
  expect(psi1.to('Pa').round(3).value).toBe("6894.758");

  expect(pa1.to('atm').round(5).value).toBe("0.00001");
  expect(atm1.to('Pa').round(5).value).toBe("101325.00000");
});

test('create unit of energy', () => {
  const energyDimension = Dimension.MASS.multiply(Dimension.LENGTH).pow(2).divide(Dimension.TIME.pow(2));
  const joule = new Unit('J', 'joule', energyDimension);
  const calorie = new Unit('cal', 'calorie', energyDimension, joule, new BigDecimal("4.184"));
  const ev = new Unit('eV', 'electron-volt', energyDimension, joule, new BigDecimal("1.602176634E-19"));

  System.METRIC.register(joule);
  System.METRIC.register(calorie);
  System.METRIC.register(ev);

  const btu = new Unit('btu', 'british-thermal-unit', energyDimension, joule, new BigDecimal("1055.05585"));
  const hpHr = new Unit('hp-hr', 'horsepower-hour', energyDimension, joule, new BigDecimal("2684519.538"));

  System.IMPERIAL.register(btu);
  System.IMPERIAL.register(hpHr);

  let j1 = Quantity.create(1, 'J');
  let btu1 = Quantity.create(1, 'btu');
  let cal1 = Quantity.create(1, 'cal');
  let hpHr1 = Quantity.create(1, 'hp-hr');

  expect(j1.to('btu').round(5).value).toBe("0.00095");
  expect(btu1.to('J').round(5).value).toBe("1055.05585");
  expect(cal1.to('J').round(5).value).toBe("4.18400");
  expect(j1.to('cal').round(5).value).toBe("0.23901");
  expect(j1.to('eV').round(5).value).toBe("6241509074460762607.77624");
  expect(cal1.to('btu').round(5).value).toBe("0.00397");
  expect(hpHr1.to('J').round(5).value).toBe("2684519.53800");
  expect(j1.to('hp-hr').round(15).value).toBe("0.000000372506136");

  // System.similarUnits('J').forEach(unit => {
  //   console.log(unit.name);
  // });
});

test('create unit of power', () => {
  const powerDimension = Dimension.MASS.multiply(Dimension.LENGTH).pow(2).divide(Dimension.TIME.pow(3));
  const watt = new Unit('W', 'watt', powerDimension);
  System.METRIC.register(watt);

  const hp = new Unit('hp', 'horsepower', powerDimension, watt, new BigDecimal("745.69987"));
  System.IMPERIAL.register(hp);

  let w1 = Quantity.create(1, 'W');
  let hp1 = Quantity.create(1, 'hp');

  expect(w1.to('hp').round(5).value).toBe("0.00134");
  expect(hp1.to('W').round(5).value).toBe("745.69987");
});

// C and F are registered by the library itself (src/units/temperature.ts) with
// correct affine (offset) conversion, so this test uses those built-in units
// instead of redefining 'C'/'F' locally, which would collide in the global
// Unit.units symbol table.
test('create unit of temperature', () => {
  let c1 = Quantity.create(1, 'C');
  let f1 = Quantity.create(1, 'F');
  let c0 = Quantity.create(0, 'C');

  expect(c0.to('F').round(5).value).toBe("32.00000");
  expect(c1.to('F').round(5).value).toBe("33.80000");
  expect(f1.to('C').round(5).value).toBe("-17.22222");
});

test('create unit of volume', () => {
  const volumeDimension = Dimension.LENGTH.pow(3);
  const cubicMeter = new Unit('m3', 'cubic-meter', volumeDimension);
  System.METRIC.register(cubicMeter);

  const cubicFoot = new Unit('ft3', 'cubic-foot', volumeDimension)
  System.IMPERIAL.register(cubicFoot);

  let m3 = Quantity.create(1, 'm3');
  let ft3 = Quantity.create(1, 'ft3');

  expect(m3.to('ft3').round(5).value).toBe("35.31467");
  expect(ft3.to('m3').round(5).value).toBe("0.02832");
});

test('create unit of area', () => {
  const areaDimension = Dimension.LENGTH.pow(2);
  const squareMeter = new Unit('m2', 'square-meter', areaDimension);
  System.METRIC.register(squareMeter);

  const squareFoot = new Unit('ft2', 'square-foot', areaDimension);
  System.IMPERIAL.register(squareFoot);

  let m2 = Quantity.create(1, 'm2');
  let ft2 = Quantity.create(1, 'ft2');

  expect(m2.to('ft2').round(5).value).toBe("10.76391");
  expect(ft2.to('m2').round(5).value).toBe("0.09290");
});

test('create unit of speed', () => {
  const speedDimension = Dimension.LENGTH.divide(Dimension.TIME);
  const meterPerSecond = new Unit('m/s', 'meter-per-second', speedDimension);
  System.METRIC.register(meterPerSecond);

  const footPerSecond = new Unit('ft/s', 'foot-per-second', speedDimension);
  System.IMPERIAL.register(footPerSecond);

  let mps1 = Quantity.create(1, 'm/s');
  let fps1 = Quantity.create(1, 'ft/s');

  expect(mps1.to('ft/s').round(5).value).toBe("3.28084");
  expect(fps1.to('m/s').round(5).value).toBe("0.30480");
});


test('create unit of acceleration', () => {
  const accelerationDimension = Dimension.LENGTH.divide(Dimension.TIME.pow(2));
  const meterPerSecondSquared = new Unit('m/s2', 'meter-per-second-squared', accelerationDimension);
  System.METRIC.register(meterPerSecondSquared);

  const footPerSecondSquared = new Unit('ft/s2', 'foot-per-second-squared', accelerationDimension);
  System.IMPERIAL.register(footPerSecondSquared);

  let mps2 = Quantity.create(1, 'm/s2');
  let fps2 = Quantity.create(1, 'ft/s2');

  expect(mps2.to('ft/s2').round(5).value).toBe("3.28084");
  expect(fps2.to('m/s2').round(5).value).toBe("0.30480");
});

test('create custom unit', () => {
  const coulomb = new Unit('Coul', 'coulomb', Dimension.create({'electric-charge': 1}));
  const volt = new Unit('V', 'volt', Dimension.create({'electric-potential': 1}));
  const ohm = new Unit('Ω', 'ohm', Dimension.create({'electric-resistance': 1}));
  const ampere = new Unit('A', 'ampere', Dimension.create({'electric-current': 1}));

  System.METRIC.register(coulomb);
  System.METRIC.register(ampere);
  System.METRIC.register(volt);
  System.METRIC.register(ohm);
});

