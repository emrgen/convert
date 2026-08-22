import BigDecimal from 'js-big-decimal';
import { Converter } from '../core';
import { registerCountUnits } from './count';
import { registerTimeUnits } from './time';
import { registerLengthUnits } from './length';
import { registerMassUnits } from './mass';
import { registerTemperatureUnits } from './temperature';
import { registerDigitalUnits } from './digital';
import { registerAngleUnits } from './angle';
import { registerFrequencyUnits } from './frequency';

export function registerAllUnits() {
  registerCountUnits();
  registerTimeUnits();
  const { meter, foot } = registerLengthUnits();
  const { kilogram, pound } = registerMassUnits();
  registerTemperatureUnits();
  registerDigitalUnits();
  registerAngleUnits();
  registerFrequencyUnits();

  Converter.register(meter, foot, new BigDecimal("3.280840"));
  Converter.register(kilogram, pound, new BigDecimal("2.20462262"));
}

registerAllUnits();
