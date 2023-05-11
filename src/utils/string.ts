export const generatePrivateThreadCode = (arg1: string, arg2: string) => {
  return arg1 > arg2 ? arg1 + `-` + arg2 : arg2 + '-' + arg1;
};
