import BigDecimal from 'js-big-decimal';
import { Unit, System, Dimension } from '../core';

export function registerAngleUnits() {
  const angleDimension = Dimension.create({angle: 1});

  const degree = new Unit('deg', 'degree', angleDimension);
  const radian = new Unit('rad', 'radian', angleDimension, degree, new BigDecimal("57.29577951"));
  const gradian = new Unit('grad', 'gradian', angleDimension, degree, 0.9);

  System.METRIC.register(degree);
  System.METRIC.register(radian);
  System.METRIC.register(gradian);

  return { degree, radian, gradian };
}
