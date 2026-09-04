import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginacaoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  /** Teto de 100 para que uma página não vire um dump da tabela. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}

export interface ResultadoPaginado<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function montarPaginacao<T>(
  data: T[],
  total: number,
  { page, limit }: { page: number; limit: number },
): ResultadoPaginado<T> {
  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/** Converte página e limite no par skip/take do Prisma. */
export function janela({ page, limit }: { page: number; limit: number }) {
  return { skip: (page - 1) * limit, take: limit };
}
