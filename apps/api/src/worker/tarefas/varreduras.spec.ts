import { describe, expect, it, vi } from 'vitest';
import type { Queue } from 'bullmq';
import type { DocumentsService } from '@/modules/documents/documents.service';
import type { ProcessesService } from '@/modules/processes/processes.service';
import { IndexacaoTarefa } from './indexacao.tarefa';
import { AcompanhamentoTarefa } from './acompanhamento.tarefa';
import type {
  JobAcompanhamentoProcesso,
  JobIndexacaoDocumento,
} from '../filas/filas';

/**
 * As varreduras de segurança.
 *
 * Existem porque o caminho normal — enfileirar na hora — pode falhar: Redis
 * indisponível no momento do upload, worker que morreu com o job na mão,
 * registros criados antes de a funcionalidade existir. Sem elas, esses casos
 * ficariam parados para sempre e ninguém saberia.
 */

function montarIndexacao(pendentes: { id: string; officeId: string }[]) {
  const addBulk = vi.fn().mockResolvedValue([]);
  const listar = vi.fn().mockResolvedValue(pendentes);

  return {
    tarefa: new IndexacaoTarefa(
      { listarPendentesDeIndexacao: listar } as unknown as DocumentsService,
      { addBulk } as unknown as Queue<JobIndexacaoDocumento>,
    ),
    addBulk,
    listar,
  };
}

function montarAcompanhamento(
  pendentes: { id: string; officeId: string; number: string }[],
) {
  const addBulk = vi.fn().mockResolvedValue([]);
  const listar = vi.fn().mockResolvedValue(pendentes);

  return {
    tarefa: new AcompanhamentoTarefa(
      {
        listarParaRetomarAcompanhamento: listar,
      } as unknown as ProcessesService,
      { addBulk } as unknown as Queue<JobAcompanhamentoProcesso>,
    ),
    addBulk,
    listar,
  };
}

describe('IndexacaoTarefa', () => {
  it('enfileira os documentos pendentes', async () => {
    const { tarefa, addBulk } = montarIndexacao([
      { id: 'doc-1', officeId: 'escritorio-1' },
      { id: 'doc-2', officeId: 'escritorio-2' },
    ]);

    await tarefa.varrer();

    const jobs = addBulk.mock.calls[0]?.[0] as {
      data: JobIndexacaoDocumento;
      opts: { jobId: string };
    }[];

    expect(jobs).toHaveLength(2);
    expect(jobs[0]?.data).toEqual({
      officeId: 'escritorio-1',
      documentId: 'doc-1',
    });
  });

  it('o jobId vem do documento, para que repetir não indexe em dobro', async () => {
    // A varredura roda a cada dez minutos e reencontra o que ainda não foi
    // processado. Sem o jobId, cada ciclo criaria um job novo.
    const { tarefa, addBulk } = montarIndexacao([
      { id: 'doc-1', officeId: 'escritorio-1' },
    ]);

    await tarefa.varrer();

    const jobs = addBulk.mock.calls[0]?.[0] as { opts: { jobId: string } }[];
    expect(jobs[0]?.opts.jobId).toBe('documento-doc-1');
  });

  it('não enfileira nada quando não há pendente', async () => {
    const { tarefa, addBulk } = montarIndexacao([]);

    await tarefa.varrer();

    expect(addBulk).not.toHaveBeenCalled();
  });

  it('uma varredura lenta não acumula com a próxima', async () => {
    const { tarefa, listar } = montarIndexacao([]);

    let liberar: () => void = () => undefined;
    listar.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          liberar = () => resolve([]);
        }),
    );

    const primeira = tarefa.varrer();
    await tarefa.varrer(); // deve desistir sem consultar de novo

    liberar();
    await primeira;

    expect(listar).toHaveBeenCalledOnce();
  });

  it('falha na consulta não derruba o worker', async () => {
    const { tarefa, listar } = montarIndexacao([]);
    listar.mockRejectedValueOnce(new Error('banco fora do ar'));

    await expect(tarefa.varrer()).resolves.toBeUndefined();
  });
});

describe('AcompanhamentoTarefa', () => {
  it('enfileira os processos que ficaram sem monitoramento', async () => {
    // Sem esta tentativa, um processo cadastrado durante uma instabilidade da
    // Judit ficaria sem acompanhamento para sempre — parecendo apenas um
    // processo parado, que é o comportamento que o produto existe para evitar.
    const { tarefa, addBulk } = montarAcompanhamento([
      {
        id: 'proc-1',
        officeId: 'escritorio-1',
        number: '10000000000000000001',
      },
    ]);

    await tarefa.varrer();

    const jobs = addBulk.mock.calls[0]?.[0] as {
      data: JobAcompanhamentoProcesso;
      opts: { jobId: string };
    }[];

    expect(jobs[0]?.data).toEqual({
      officeId: 'escritorio-1',
      processId: 'proc-1',
      numero: '10000000000000000001',
    });
    expect(jobs[0]?.opts.jobId).toBe('acompanhamento-proc-1');
  });

  it('não enfileira nada quando está tudo monitorado', async () => {
    const { tarefa, addBulk } = montarAcompanhamento([]);

    await tarefa.varrer();

    expect(addBulk).not.toHaveBeenCalled();
  });

  it('falha na consulta não derruba o worker', async () => {
    const { tarefa, listar } = montarAcompanhamento([]);
    listar.mockRejectedValueOnce(new Error('banco fora do ar'));

    await expect(tarefa.varrer()).resolves.toBeUndefined();
  });
});
