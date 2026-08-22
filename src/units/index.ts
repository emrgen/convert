import BigDecimal from 'js-big-decimal';
import { Converter } from '../core';
import { registerCountUnits } from './count';
import { registerTimeUnits } from './time';
import { registerLengthUnits } from './length';
import { registerMassUnits } from './mass';

export function registerAllUnits() {
  registerCountUnits();
  registerTimeUnits();
  const { meter, foot } = registerLengthUnits();
  const { kilogram, pound } = registerMassUnits();

  Converter.register(meter, foot, new BigDecimal("3.280840"));
  Converter.register(kilogram, pound, new BigDecimal("2.20462262"));
}

registerAllUnits();
