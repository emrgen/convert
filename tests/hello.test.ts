import { expect, test } from 'vitest'
import {Quantity, QuantityUnit} from "../src";

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

  // console.log(m1.in('ft'))
  // console.log(km1.in('ft'))
  // console.log(yd1.in('ft'))
  // console.log(mile1.in('ft').in('in'))

  let m90 = QuantityUnit.create(90, 'm');

  // console.log(m90.in('yd').value)
  console.log(m1.in('yd').value)

  // expect(m1.to('ft').value).toBe("3.28084");
})