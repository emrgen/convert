import BigDecimal from 'js-big-decimal';
import { Unit, System, Dimension } from '../core';

export function registerLengthUnits() {
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

  const foot = new Unit('ft', 'foot', Dimension.LENGTH);
  const inch = new Unit('in', 'inch', Dimension.LENGTH, foot, new BigDecimal("0.0833333333"));
  const yard = new Unit('yd', 'yard', Dimension.LENGTH, foot, 3);
  const mile = new Unit('mi', 'mile', Dimension.LENGTH, yard, 1760);

  System.IMPERIAL.register(inch);
  System.IMPERIAL.register(foot);
  System.IMPERIAL.register(yard);
  System.IMPERIAL.register(mile);

  return { meter, kilometer, centimeter, millimeter, micrometer, nanometer, foot, inch, yard, mile };
}
