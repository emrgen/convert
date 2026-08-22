import { Unit, System, Dimension } from '../core';

export function registerDigitalUnits() {
  const digitalDimension = Dimension.create({digital: 1});

  const byte = new Unit('B', 'byte', digitalDimension);
  const bit = new Unit('bit', 'bit', digitalDimension, byte, 0.125);
  const kilobyte = new Unit('KB', 'kilobyte', digitalDimension, byte, 1024);
  const megabyte = new Unit('MB', 'megabyte', digitalDimension, byte, 1024 ** 2);
  const gigabyte = new Unit('GB', 'gigabyte', digitalDimension, byte, 1024 ** 3);
  const terabyte = new Unit('TB', 'terabyte', digitalDimension, byte, 1024 ** 4);

  System.METRIC.register(byte);
  System.METRIC.register(bit);
  System.METRIC.register(kilobyte);
  System.METRIC.register(megabyte);
  System.METRIC.register(gigabyte);
  System.METRIC.register(terabyte);

  return { byte, bit, kilobyte, megabyte, gigabyte, terabyte };
}
