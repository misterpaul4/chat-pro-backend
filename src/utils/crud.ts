import { ParamOption } from '@nestjsx/crud';

export const generalCrudOptions: {
  params: { [value in string]: ParamOption };
} = {
  params: {
    id: {
      primary: true,
      type: 'uuid',
      field: 'id',
    },
  },
};
