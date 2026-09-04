import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { FiltroDeExcecao } from './filtro-de-excecao';

@Module({
  providers: [{ provide: APP_FILTER, useClass: FiltroDeExcecao }],
})
export class ObservabilidadeModule {}
