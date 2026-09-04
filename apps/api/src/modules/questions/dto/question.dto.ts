import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';
import {
  BooleanoOpcional,
  type BooleanoDaQuery,
} from '@/common/dto/booleano-da-query';

export class CriarPerguntaDto {
  /** A pergunta, como o cliente a faria. */
  @IsString()
  @MinLength(3)
  @Transform(({ value }: { value: string }) => value?.trim())
  title!: string;

  /** A resposta que o agente deve dar. */
  @IsString()
  @MinLength(3)
  @Transform(({ value }: { value: string }) => value?.trim())
  description!: string;

  @IsOptional() @IsBoolean() status?: boolean;
}

export class AtualizarPerguntaDto {
  @IsOptional() @IsString() @MinLength(3) title?: string;
  @IsOptional() @IsString() @MinLength(3) description?: string;
  @IsOptional() @IsBoolean() status?: boolean;
}

export class ListarPerguntasDto extends PaginacaoDto {
  /** Texto, não booleano — ver booleano-da-query.ts. */
  @BooleanoOpcional() status?: BooleanoDaQuery;
}
