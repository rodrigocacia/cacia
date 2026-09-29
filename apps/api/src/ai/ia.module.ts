import { Module } from '@nestjs/common';
import { QdrantModule } from '@/integrations/qdrant/qdrant.module';
import { LeadsModule } from '@/modules/leads/leads.module';
import { TagsModule } from '@/modules/tags/tags.module';
import { provedorDeepSeek, provedorOpenAI } from './cliente-openai';
import { EmbeddingsService } from './embeddings.service';
import { LlmService } from './llm.service';
import { ConsumoDeIaService } from './consumo/consumo-de-ia.service';
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
  // LeadsModule e TagsModule porque as ferramentas de funil escrevem pelo
  // servico, nao pelo Prisma: e la que a projecao do status e o registro no
  // historico acontecem.
  imports: [QdrantModule, LeadsModule, TagsModule],
  providers: [
    provedorOpenAI,
    provedorDeepSeek,
    ConsumoDeIaService,
    LlmService,
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
    ConsumoDeIaService,
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
