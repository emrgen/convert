import { Unit, System, Dimension } from '../core';

export function registerCountUnits() {
  const count = new Unit('count', 'count', Dimension.COUNT);
  System.Universal.register(count);

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

  const pair = new Unit('pair', 'pair', Dimension.COUNT, count, 2);
  const dozen = new Unit('doz', 'dozen', Dimension.COUNT, count, 12);

  System.IMPERIAL.register(pair);
  System.IMPERIAL.register(dozen);

  return { count, hundred, thousand, million, billion, trillion, quadrillion, pair, dozen };
}
