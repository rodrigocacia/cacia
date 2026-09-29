import { IsArray, IsObject, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { LeadImportStatus } from '@cacia/database';
import { PaginacaoDto } from '@/common/dto/paginacao.dto';

/**
 * Confirmação da importação: o que cada coluna significa e onde os leads caem.
 *
 * O mapeamento vem da tela, não do servidor. A sugestão automática abre o
 * formulário preenchido, mas quem decide é quem está olhando a planilha —
 * "Contato" pode ser o nome numa empresa e o telefone em outra.
 */
export class ConfirmarImportacaoDto {
  /**
   * Índice da coluna para campo do lead: `{ "0": "name", "2": "remotejid" }`.
   *
   * Validado no serviço, não por decorator: as chaves são dinâmicas (índices
   * de coluna) e os valores precisam ser conferidos contra a lista de campos
   * importáveis, o que nenhum decorator de forma faz.
   */
  @IsObject()
  mapping!: Record<string, string>;

  /** Etapa de entrada. Ausente significa a primeira do funil padrão. */
  @IsOptional() @IsUUID() stageId?: string;

  /** Etiquetas aplicadas a todo lead desta importação. */
  @IsOptional() @IsArray() @IsUUID('4', { each: true }) tagIds?: string[];
}

export class ListarImportacoesDto extends PaginacaoDto {
  @IsOptional() @IsEnum(LeadImportStatus) status?: LeadImportStatus;
}
