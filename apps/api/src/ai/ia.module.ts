import { Module } from '@nestjs/common';
import { QdrantModule } from '@/integrations/qdrant/qdrant.module';
import { EmbeddingsService } from './embeddings.service';
import { MemoriaService } from './memoria/memoria.service';
import { SumarizacaoService } from './memoria/sumarizacao.service';
import { ExtracaoDeFatosService } from './memoria/extracao-de-fatos.service';

/**
 * Camada de inteligência artificial.
 *
 * A memória em três camadas é o que substitui a janela deslizante de 20
 * mensagens do sistema anterior — ver memoria.service.ts.
 */
@Module({
  imports: [QdrantModule],
  providers: [
    EmbeddingsService,
    MemoriaService,
    SumarizacaoService,
    ExtracaoDeFatosService,
  ],
  exports: [
    EmbeddingsService,
    MemoriaService,
    SumarizacaoService,
    ExtracaoDeFatosService,
  ],
})
export class IaModule {}
