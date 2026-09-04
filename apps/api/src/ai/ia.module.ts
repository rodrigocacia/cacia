import { Module } from '@nestjs/common';
import { QdrantModule } from '@/integrations/qdrant/qdrant.module';
import { provedorOpenAI } from './cliente-openai';
import { EmbeddingsService } from './embeddings.service';
import { MemoriaService } from './memoria/memoria.service';
import { SumarizacaoService } from './memoria/sumarizacao.service';
import { ExtracaoDeFatosService } from './memoria/extracao-de-fatos.service';
import { PromptService } from './agente/prompt.service';
import { AgenteService } from './agente/agente.service';
import { FerramentasService } from './ferramentas/ferramentas.service';
import { RagService } from './rag/rag.service';

/**
 * Camada de inteligência artificial.
 *
 * A memória em três camadas é o que substitui a janela deslizante de 20
 * mensagens do sistema anterior — ver memoria.service.ts.
 */
@Module({
  imports: [QdrantModule],
  providers: [
    provedorOpenAI,
    EmbeddingsService,
    MemoriaService,
    SumarizacaoService,
    ExtracaoDeFatosService,
    PromptService,
    AgenteService,
    FerramentasService,
    RagService,
  ],
  exports: [
    EmbeddingsService,
    MemoriaService,
    SumarizacaoService,
    ExtracaoDeFatosService,
    PromptService,
    AgenteService,
    RagService,
  ],
})
export class IaModule {}
