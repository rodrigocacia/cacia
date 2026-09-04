import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { DocumentCategory, DocumentStatus } from '@cacia/database';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

export class EnviarDocumentoDto {
  @IsOptional() @IsString() @MinLength(1) title?: string;
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsUUID() processId?: string;
  @IsOptional() @IsUUID() folderId?: string;
}

export class ListarDocumentosDto extends PaginacaoDto {
  @IsOptional() @IsUUID() customerId?: string;
  @IsOptional() @IsUUID() processId?: string;
  @IsOptional() @IsUUID() folderId?: string;
}

/**
 * O que pode mudar em um documento depois de enviado.
 *
 * O arquivo não: trocar o conteúdo por baixo de um documento já aprovado
 * apagaria a versão que alguém revisou. Para conteúdo novo, envia-se outro.
 */
export class AtualizarDocumentoDto {
  @IsOptional() @IsString() @MinLength(1) title?: string;
  @IsOptional() @IsEnum(DocumentStatus) status?: DocumentStatus;
  @IsOptional() @IsEnum(DocumentCategory) category?: DocumentCategory;

  /** Texto do documento gerado pelo editor. */
  @IsOptional() @IsString() content?: string;

  /** `null` desvincula. */
  @IsOptional() @IsUUID() folderId?: string | null;
  @IsOptional() @IsUUID() customerId?: string | null;
  @IsOptional() @IsUUID() processId?: string | null;
}
