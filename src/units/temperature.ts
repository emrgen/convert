import BigDecimal from 'js-big-decimal';
import { Unit, System, Dimension } from '../core';

export function registerTemperatureUnits() {
  const celsius = new Unit('C', 'celsius', Dimension.TEMPERATURE);
  System.METRIC.register(celsius);

  const fahrenheit = new Unit('F', 'fahrenheit', Dimension.TEMPERATURE, celsius, new BigDecimal("0.5555555556"), new BigDecimal("-17.77777778"));
  System.IMPERIAL.register(fahrenheit);

  const kelvin = new Unit('K', 'kelvin', Dimension.TEMPERATURE, celsius, 1, -273.15);
  System.METRIC.register(kelvin);

  return { celsius, fahrenheit, kelvin };
}
