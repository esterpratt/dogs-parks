const getSum = (arr: number[]) =>
  arr.reduce((partialSum, a) => partialSum + a, 0);

const getMean = (arr: number[]) => {
  const sum = getSum(arr);
  return sum / arr.length;
};

const getSTD = (arr: number[]) => {
  const mean = getMean(arr);
  const variance = getSum(arr.map((v) => (v - mean) ** 2));
  return variance;
};

export { getSTD, getSum, getMean };
