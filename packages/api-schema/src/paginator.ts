import { z } from 'zod';

export const pageReqSchema = z.object({
  currentPage: z
    .union([
      z.string().transform((val) => Number.parseInt(val, 10)),
      z.number(),
    ])
    .pipe(
      z
        .number()
        .min(1, { message: 'Page number cannot be less than 1' })
        .max(9999, { message: 'Page number cannot be greater than 9999' }),
    )
    .optional()
    .default(1),
  pageSize: z
    .union([
      z.string().transform((val) => Number.parseInt(val, 10)),
      z.number(),
    ])
    .pipe(
      z
        .number()
        .min(1, { message: 'Page size cannot be less than 1' })
        .max(50, { message: 'Page size cannot be greater than 50' }),
    )
    .optional()
    .default(10),
});

export type PageReq = z.infer<typeof pageReqSchema>;

export type PaginationResult<T> = {
  list: T[];
  paginator: {
    currentPage: number;
    pageSize: number;
    totalPage: number;
    totalRecord: number;
  };
};

export const searchPageReqSchema = pageReqSchema.extend({
  searchWord: z.string().optional().default(''),
});

export type SearchPageReq = z.infer<typeof searchPageReqSchema>;

export const calculatePagination = (pageReq: PageReq) => {
  const { currentPage, pageSize } = pageReq;
  const offset = (currentPage - 1) * pageSize;
  return {
    offset,
    limit: pageSize,
  };
};

export const paginationResult = <T>(
  list: T[],
  total: number,
  pageReq: PageReq,
): PaginationResult<T> => {
  const { currentPage, pageSize } = pageReq;
  return {
    list,
    paginator: {
      currentPage,
      pageSize,
      totalPage: Math.ceil(total / pageSize),
      totalRecord: total,
    },
  };
};
