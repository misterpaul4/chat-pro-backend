export const generatePrivateThreadCode = (arg1: string, arg2: string) => {
  return arg1 > arg2 ? arg1 + `-` + arg2 : arg2 + '-' + arg1;
};

export const generateRandomNumber = (length: number) => {
  if (length < 1) {
    length = 1;
  }

  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1));
};
