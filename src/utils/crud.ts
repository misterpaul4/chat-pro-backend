import {
  GetManyDefaultResponse,
  ParamOption,
  QueryOptions,
} from '@nestjsx/crud';

export const generalCrudOptions: {
  params: { [value in string]: ParamOption };
  query?: QueryOptions;
} = {
  params: {
    id: {
      primary: true,
      type: 'uuid',
      field: 'id',
    },
  },
  query: { alwaysPaginate: true },
};

export const emptyResponse: GetManyDefaultResponse<unknown> = {
  count: 1,
  data: [],
  page: 1,
  pageCount: 1,
  total: 0,
};

export const emptyPromiseResponse = (): Promise<
  GetManyDefaultResponse<unknown>
> => {
  return new Promise<GetManyDefaultResponse<unknown>>((resolve) => {
    resolve(emptyResponse);
  });
};
