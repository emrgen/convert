import BigDecimal from 'js-big-decimal';
import { Unit, System, Dimension } from '../core';

export function registerMassUnits() {
  const kilogram = new Unit('kg', 'kilogram', Dimension.MASS);
  const decagram = new Unit('dag', 'decagram', Dimension.MASS, kilogram, 10);
  const hectogram = new Unit('hg', 'hectogram', Dimension.MASS, kilogram, 100);
  const gram = new Unit('g', 'gram', Dimension.MASS, kilogram, 0.001);
  const milligram = new Unit('mg', 'milligram', Dimension.MASS, kilogram, 0.000001);
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

  const pound = new Unit('lb', 'pound', Dimension.MASS);
  const ounce = new Unit('oz', 'ounce', Dimension.MASS, pound, new BigDecimal("0.0625"));

  System.IMPERIAL.register(pound);
  System.IMPERIAL.register(ounce);

  return { kilogram, decagram, hectogram, gram, milligram, microgram, nanogram, ton, quintal, pound, ounce };
}
