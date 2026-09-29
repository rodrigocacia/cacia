import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AdminDaPlataforma } from '@/auth/decorators/admin.decorator';
import { SkipTenant } from '@/auth/decorators/skip-tenant.decorator';
import { RelatorioDeConsumoService } from '@/modules/ai-usage/relatorio-de-consumo.service';
import {
  ParametrosDeCobrancaDto,
  PeriodoDeConsumoDto,
  PrecoDeModeloDto,
} from '@/modules/ai-usage/dto/ai-usage.dto';
import { AdminService } from './admin.service';
import {
  AtualizarEscritorioPeloPainelDto,
  AtualizarSituacaoDoEscritorioDto,
  AtualizarUsuarioDto,
  CriarEscritorioComDonoDto,
  CriarUsuarioDto,
  ListarEscritoriosDto,
  ListarUsuariosDto,
} from './dto/admin.dto';

/**
 * Administração da plataforma — o painel do operador da CacIA.
 *
 * `@SkipTenant()` porque estas rotas atravessam escritórios, e
 * `@AdminDaPlataforma()` porque isso só pode valer para quem administra a
 * plataforma. Os dois decorators são declarados no controller inteiro: uma
 * rota nova aqui nasce protegida, e não desprotegida por esquecimento.
 */
@SkipTenant()
@AdminDaPlataforma()
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly consumo: RelatorioDeConsumoService,
  ) {}

  @Get('dashboard')
  painel() {
    return this.admin.painel();
  }

  // ---- escritórios --------------------------------------------------------

  @Get('offices')
  listarEscritorios(@Query() dto: ListarEscritoriosDto) {
    return this.admin.listarEscritorios(dto);
  }

  /** Cadastra o escritório e o dono dele — é o trabalho central do painel. */
  @Post('offices')
  criarEscritorio(@Body() dto: CriarEscritorioComDonoDto) {
    return this.admin.criarEscritorioComDono(dto);
  }

  @Get('offices/:id')
  detalharEscritorio(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.detalharEscritorio(id);
  }

  @Get('offices/:id/performance')
  desempenho(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('periodInDays', new ParseIntPipe({ optional: true }))
    dias?: number,
  ) {
    return this.admin.desempenhoDoEscritorio(id, dias ?? 30);
  }

  @Patch('offices/:id')
  atualizarEscritorio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarEscritorioPeloPainelDto,
  ) {
    return this.admin.atualizarEscritorio(id, dto);
  }

  @Patch('offices/:id/status')
  alterarSituacao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarSituacaoDoEscritorioDto,
  ) {
    return this.admin.alterarSituacaoDoEscritorio(id, dto.status);
  }

  @Delete('offices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerEscritorio(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.admin.removerEscritorio(id);
  }

  // ---- consumo de IA ------------------------------------------------------

  /** Todos os escritórios no período: custo, margem e valor a cobrar. */
  @Get('ai-usage')
  consumoGeral(@Query() dto: PeriodoDeConsumoDto) {
    return this.consumo.visaoGeral(dto.from, dto.to);
  }

  @Get('offices/:id/ai-usage')
  async consumoDoEscritorio(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dto: PeriodoDeConsumoDto,
  ) {
    await this.consumo.garantirEscritorio(id);
    return this.consumo.detalheDoEscritorio(id, dto.from, dto.to);
  }

  @Get('ai-billing')
  parametrosDeCobranca() {
    return this.consumo.parametros();
  }

  @Put('ai-billing')
  atualizarCobranca(@Body() dto: ParametrosDeCobrancaDto) {
    return this.consumo.atualizarParametros(dto);
  }

  @Put('ai-prices/:model')
  salvarPreco(@Param('model') modelo: string, @Body() dto: PrecoDeModeloDto) {
    return this.consumo.salvarPreco(modelo, dto);
  }

  @Delete('ai-prices/:model')
  removerPreco(@Param('model') modelo: string) {
    return this.consumo.removerPreco(modelo);
  }

  // ---- usuários -----------------------------------------------------------

  @Get('users')
  listarUsuarios(@Query() dto: ListarUsuariosDto) {
    return this.admin.listarUsuarios(dto);
  }

  @Post('users')
  criarUsuario(@Body() dto: CriarUsuarioDto) {
    return this.admin.criarUsuario(dto);
  }

  @Get('users/:id')
  detalharUsuario(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.detalharUsuario(id);
  }

  @Patch('users/:id')
  atualizarUsuario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarUsuarioDto,
  ) {
    return this.admin.atualizarUsuario(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerUsuario(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.admin.removerUsuario(id);
  }
}
