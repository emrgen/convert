import BigDecimal from 'js-big-decimal';
import { Unit, System, Dimension } from '../core';

export function registerFrequencyUnits() {
  const frequencyDimension = Dimension.create({frequency: 1});

  const hertz = new Unit('Hz', 'hertz', frequencyDimension);
  const kilohertz = new Unit('kHz', 'kilohertz', frequencyDimension, hertz, 1000);
  const megahertz = new Unit('MHz', 'megahertz', frequencyDimension, hertz, 1000000);
  const gigahertz = new Unit('GHz', 'gigahertz', frequencyDimension, hertz, 1000000000);

  System.METRIC.register(hertz);
  System.METRIC.register(kilohertz);
  System.METRIC.register(megahertz);
  System.METRIC.register(gigahertz);

  const rpm = new Unit('rpm', 'revolutions-per-minute', frequencyDimension, hertz, new BigDecimal("0.0166666667"));
  System.IMPERIAL.register(rpm);

  return { hertz, kilohertz, megahertz, gigahertz, rpm };
}
