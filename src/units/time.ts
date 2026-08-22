import { Unit, System, Dimension } from '../core';

export function registerTimeUnits() {
  const second = new Unit('s', 'second', Dimension.TIME);
  System.METRIC.register(second);

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

  return { second, minute, hour, day, week, month, year };
}
