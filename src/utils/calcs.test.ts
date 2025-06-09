import { getSum, getMean, getSTD } from './calcs';

describe('getSum', () => {
  it('returns 0 for an empty array', () => {
    expect(getSum([])).toBe(0);
  });
  it('returns the sum of array elements', () => {
    expect(getSum([1, 2, 3])).toBe(6);
    expect(getSum([-1, 1, 2])).toBe(2);
  });
});

describe('getMean', () => {
  it('returns NaN for an empty array', () => {
    expect(getMean([])).toBeNaN();
  });
  it('returns the mean of array elements', () => {
    expect(getMean([1, 2, 3])).toBe(2);
    expect(getMean([2, 4, 6, 8])).toBe(5);
  });
});

describe('getSTD', () => {
  it('returns NaN for an empty array', () => {
    expect(getSTD([])).toBeNaN();
  });
  it('returns the variance (not stddev) of array elements', () => {
    // For [1,2,3], mean=2, variance=((1+0+1)/3)=0.666...
    expect(getSTD([1, 2, 3])).toBeCloseTo(0.666666, 5);
    // For [2,4,4,4,5,5,7,9], mean=5, variance=4
    expect(getSTD([2,4,4,4,5,5,7,9])).toBeCloseTo(4, 5);
  });
  it('uses the given mean if provided', () => {
    // For [1,2,3] with mean=0, variance=((1+4+9)/3)=4.666...
    expect(getSTD([1,2,3], 0)).toBeCloseTo(4.666666, 5);
  });
});
