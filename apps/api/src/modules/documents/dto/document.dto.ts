import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
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
