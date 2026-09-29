import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ArquivoEnviado {
  chave: string;
  url: string;
  tamanhoBytes: number;
}

/** Validade do link temporário de download. */
const VALIDADE_LINK_SEGUNDOS = 15 * 60;

/**
 * Armazenamento de arquivos em qualquer serviço compatível com S3 — Cloudflare
 * R2 em produção, S3 local (docker compose).
 *
 * Substitui a prática do sistema anterior de guardar o arquivo em base64
 * dentro da linha da tabela. Aquilo inflava o banco e degradava toda consulta
 * às tabelas de mensagem e documento — cada `SELECT` carregava megabytes de
 * conteúdo que ninguém tinha pedido.
 *
 * Todo arquivo é privado e sai só por link temporário. Não há ACL por objeto:
 * o R2 não a implementa (visibilidade é por bucket), e documento jurídico
 * acessível por URL adivinhável seria vazamento.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly cliente: S3Client;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('STORAGE_BUCKET');

    this.cliente = new S3Client({
      endpoint: config.getOrThrow<string>('STORAGE_ENDPOINT'),
      // O R2 exige "auto"; os demais aceitam a região configurada
      region: config.get<string>('STORAGE_REGION') ?? 'auto',
      credentials: {
        accessKeyId: config.getOrThrow<string>('STORAGE_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('STORAGE_SECRET_ACCESS_KEY'),
      },
      // Caminho no lugar de subdomínio: funciona no R2 e no S3 local
      forcePathStyle: true,
    });
  }

  /**
   * Envia um arquivo.
   *
   * A chave começa pelo escritório: além de organizar, permite auditar e
   * remover tudo de um cliente sem depender do banco.
   */
  async enviar(params: {
    officeId: string;
    conteudo: Buffer;
    nomeOriginal: string;
    mimetype: string;
  }): Promise<ArquivoEnviado> {
    const extensao = params.nomeOriginal.split('.').pop() ?? 'bin';
    const chave = `${params.officeId}/${randomUUID()}.${extensao}`;

    await this.cliente.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: chave,
        Body: params.conteudo,
        ContentType: params.mimetype,
      }),
    );

    return {
      chave,
      url: chave,
      tamanhoBytes: params.conteudo.byteLength,
    };
  }

  /**
   * Link temporário de download.
   *
   * Para arquivos privados. Expira em 15 minutos: tempo de sobra para baixar,
   * curto o bastante para que um link vazado não sirva por muito tempo.
   */
  gerarLinkTemporario(chave: string): Promise<string> {
    return getSignedUrl(
      this.cliente,
      new GetObjectCommand({ Bucket: this.bucket, Key: chave }),
      { expiresIn: VALIDADE_LINK_SEGUNDOS },
    );
  }

  async baixar(chave: string): Promise<Buffer> {
    const resposta = await this.cliente.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: chave }),
    );

    const bytes = await resposta.Body?.transformToByteArray();

    if (!bytes) throw new Error(`Arquivo vazio ou inexistente: ${chave}`);

    return Buffer.from(bytes);
  }

  async remover(chave: string): Promise<void> {
    await this.cliente.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: chave }),
    );
  }

  /**
   * Confirma que a chave pertence ao escritório.
   *
   * O prefixo é a fronteira: sem essa checagem, um id de documento de outro
   * escritório permitiria baixar o arquivo dele.
   */
  pertenceAoEscritorio(chave: string, officeId: string): boolean {
    return chave.startsWith(`${officeId}/`);
  }
}
