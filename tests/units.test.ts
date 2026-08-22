import {expect, test} from 'vitest'
import {Quantity} from "../src";

test('temperature conversion (absolute, not just delta)', () => {
  expect(Quantity.create(0, 'C').to('F').round(2).value).toBe("32.00");
  expect(Quantity.create(100, 'C').to('F').round(2).value).toBe("212.00");
  expect(Quantity.create(32, 'F').to('C').round(2).value).toBe("0.00");
  expect(Quantity.create('98.6', 'F').to('C').round(2).value).toBe("37.00");
  expect(Quantity.create(0, 'C').to('K').round(2).value).toBe("273.15");
  expect(Quantity.create(273.15, 'K').to('C').round(2).value).toBe("0.00");
});

test('digital storage conversion', () => {
  expect(Quantity.create(1, 'KB').to('B').round(2).value).toBe("1024.00");
  expect(Quantity.create(1, 'MB').to('KB').round(2).value).toBe("1024.00");
  expect(Quantity.create(1, 'B').to('bit').round(2).value).toBe("8.00");
  expect(Quantity.create(1, 'GB').to('MB').round(2).value).toBe("1024.00");
});

test('angle conversion', () => {
  expect(Quantity.create(180, 'deg').to('rad').round(5).value).toBe("3.14159");
  expect(Quantity.create(1, 'rad').to('deg').round(5).value).toBe("57.29578");
  expect(Quantity.create(100, 'grad').to('deg').round(5).value).toBe("90.00000");
});

test('frequency conversion', () => {
  expect(Quantity.create(1, 'kHz').to('Hz').round(2).value).toBe("1000.00");
  expect(Quantity.create(1000000, 'Hz').to('MHz').round(2).value).toBe("1.00");
  expect(Quantity.create(60, 'rpm').to('Hz').round(2).value).toBe("1.00");
});
