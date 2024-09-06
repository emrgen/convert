import { expect, test } from 'vitest'
import {Quantity, QuantityUnit} from "../src";
import BigDecimal from "js-big-decimal";

test('to base unit', () => {
  // const km1 = Quantity.create(1, 'km');
  //
  // console.log(km1.unit.toBase())
  // expect(km1.toBase().value).toBe("1000");
})

test('ft to meter', () => {
  let m1 = QuantityUnit.create(1, 'm');
  let km1 = QuantityUnit.create(1, 'km');
  let yd1 = QuantityUnit.create(1, 'yd');
  let f1 = QuantityUnit.create(1, 'ft');
  let i1 = QuantityUnit.create(1, 'in');
  let mile1 = QuantityUnit.create(1, 'mi');

  let kg1 = QuantityUnit.create(1, 'kg');
  let pound1 = QuantityUnit.create(1, 'lb');
  let ounce1 = QuantityUnit.create(1, 'oz');


  let m90 = QuantityUnit.create(90, 'm');

  expect(m90.in('yd').round(5).value).toBe("98.42520");

  expect(m1.in('yd').round(5).value).toBe("1.09361");
  expect(m1.to('ft').round(5).value).toBe("3.28084");
  expect(m1.to('in').round(5).value).toBe("39.37008");
  expect(m1.to('mi').round(5).value).toBe("0.00062");
  expect(m1.to('km').round(5).value).toBe("0.00100");
  expect(m1.to('m').round(5).value).toBe("1.00000");

  expect(km1.to('ft').round(5).value).toBe("3280.83989");
  expect(km1.to('in').round(5).value).toBe("39370.07870");
  expect(km1.to('mi').round(5).value).toBe("0.62137");
  expect(km1.to('km').round(5).value).toBe("1.00000");
  expect(km1.to('m').round(5).value).toBe("1000.00000");

  expect(yd1.to('ft').round(5).value).toBe("3.00000");
  expect(yd1.to('in').round(5).value).toBe("36.00000");
  expect(yd1.to('mi').round(5).value).toBe("0.00057");
  expect(yd1.to('km').round(5).value).toBe("0.00091");
  expect(yd1.to('m').round(5).value).toBe("0.91440");

  expect(f1.to('ft').round(5).value).toBe("1.00000");
  expect(f1.to('in').round(5).value).toBe("12.00000");
  expect(f1.to('mi').round(5).value).toBe("0.00019");
  expect(f1.to('km').round(5).value).toBe("0.00030");
  expect(f1.to('m').round(5).value).toBe("0.30480");

  expect(i1.to('ft').round(5).value).toBe("0.08333");
  expect(i1.to('in').round(5).value).toBe("1.00000");
  expect(i1.to('mi').round(5).value).toBe("0.00002");
  expect(i1.to('km').round(5).value).toBe("0.00003");

  expect(mile1.to('ft').round(5).value).toBe("5280.00000");
  expect(mile1.to('in').round(5).value).toBe("63360.00000");
  expect(mile1.to('mi').round(5).value).toBe("1.00000");
  expect(mile1.to('km').round(5).value).toBe("1.60934");

  expect(kg1.to('lb').round(5).value).toBe("2.20462");
  expect(pound1.to('kg').round(5).value).toBe("0.45359");

  // matching upto 4 decimal places
  expect(kg1.to('oz').round(4).value).toBe("35.2739");

  expect(pound1.to('oz').round(5).value).toBe("16.00000");
});