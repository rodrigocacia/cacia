import { Injectable, Logger } from '@nestjs/common';
import { MarkAuthor, MarkCategory, MarkType } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { LlmService } from '../llm.service';
import type { UsoDeIa } from '../consumo/consumo-de-ia.service';
import { MemoriaService } from './memoria.service';

const INSTRUCAO = `Você extrai fatos duráveis de conversas de atendimento jurídico.

Fato durável é o que continua verdadeiro daqui a semanas e ajuda a atender melhor:
preferência de tratamento, horário em que a pessoa pode falar, situação pessoal
relevante ao caso, decisão tomada, restrição informada.

NÃO são fatos duráveis: saudações, o assunto momentâneo da conversa, perguntas,
o que a própria IA respondeu, nem qualquer coisa que já mude na semana seguinte.

Responda em JSON, no formato:
{"fatos":[{"conteudo":"...","categoria":"preference|address|feedback|other"}]}

Prefira nenhum fato a um fato duvidoso: uma anotação errada será lembrada por
meses e distorce todo atendimento seguinte. Devolva {"fatos":[]} quando não
houver nada que valha guardar.`;

interface FatoExtraido {
  conteudo: string;
  categoria: string;
}

const CATEGORIAS: Record<string, MarkCategory> = {
  preference: MarkCategory.PREFERENCE,
  address: MarkCategory.ADDRESS,
  feedback: MarkCategory.FEEDBACK,
  other: MarkCategory.OTHER,
};

/**
 * Extrai fatos duráveis da conversa e os grava como anotações indexadas.
 *
 * É o que alimenta a camada fria da memória. Sem isso, a IA esqueceria o nome
 * pelo qual a pessoa prefere ser chamada assim que a conversa saísse da janela
 * quente — que era exatamente o sintoma relatado no sistema anterior.
 */
@Injectable()
export class ExtracaoDeFatosService {
  private readonly logger = new Logger(ExtracaoDeFatosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly memoria: MemoriaService,
    private readonly llm: LlmService,
  ) {}

  async extrairDoTurno(params: {
    officeId: string;
    chatId: string;
    mensagemCliente: string;
    respostaAgente: string;
    customerId?: string;
    leadId?: string;
  }): Promise<number> {
    try {
      const fatos = await this.pedirExtracao(
        params.mensagemCliente,
        params.respostaAgente,
        { officeId: params.officeId, chatId: params.chatId },
      );

      if (fatos.length === 0) return 0;

      for (const fato of fatos) {
        await this.gravar(params, fato);
      }

      this.logger.log(
        `${fatos.length} fato(s) extraído(s) da conversa ${params.chatId}`,
      );

      return fatos.length;
    } catch (erro) {
      // Falhar aqui não afeta a resposta ao cliente — ela já foi enviada.
      this.logger.warn(
        `Falha ao extrair fatos da conversa ${params.chatId}: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
      return 0;
    }
  }

  private async pedirExtracao(
    mensagemCliente: string,
    respostaAgente: string,
    uso: UsoDeIa,
  ): Promise<FatoExtraido[]> {
    const resposta = await this.llm.completar({
      tarefa: 'extracao',
      uso,
      temperatura: 0,
      json: true,
      maxTokens: 300,
      messages: [
        { role: 'system', content: INSTRUCAO },
        {
          role: 'user',
          content: `Cliente: ${mensagemCliente}\nAtendente: ${respostaAgente}`,
        },
      ],
    });

    const bruto = resposta.choices[0]?.message.content;
    if (!bruto) return [];

    const dados = JSON.parse(bruto) as { fatos?: FatoExtraido[] };

    return (dados.fatos ?? []).filter(
      (f) => typeof f.conteudo === 'string' && f.conteudo.trim().length > 3,
    );
  }

  private async gravar(
    params: {
      officeId: string;
      chatId: string;
      customerId?: string;
      leadId?: string;
    },
    fato: FatoExtraido,
  ): Promise<void> {
    const anotacao = await this.prisma.mark.create({
      data: {
        officeId: params.officeId,
        chatId: params.chatId,
        customerId: params.customerId,
        leadId: params.leadId,
        type: params.customerId ? MarkType.CUSTOMER : MarkType.LEAD,
        category: CATEGORIAS[fato.categoria] ?? MarkCategory.OTHER,
        author: MarkAuthor.AGENT,
        title: fato.conteudo.slice(0, 120),
        description: fato.conteudo,
      },
      select: { id: true },
    });

    await this.memoria.indexarFato({
      markId: anotacao.id,
      officeId: params.officeId,
      chatId: params.chatId,
      conteudo: fato.conteudo,
      customerId: params.customerId,
      leadId: params.leadId,
    });
  }
}
