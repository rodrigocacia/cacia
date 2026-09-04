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
 * Armazenamento de arquivos no DigitalOcean Spaces (compatível com S3).
 *
 * Substitui a prática do sistema anterior de guardar o arquivo em base64
 * dentro da linha da tabela. Aquilo inflava o banco e degradava toda consulta
 * às tabelas de mensagem e documento — cada `SELECT` carregava megabytes de
 * conteúdo que ninguém tinha pedido.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly cliente: S3Client;
  private readonly bucket: string;
  private readonly urlPublica: string;

  constructor(config: ConfigService) {
    const endpoint = config.getOrThrow<string>('DO_ENDPOINT');

    this.bucket = config.getOrThrow<string>('DO_BUCKET');
    this.urlPublica = config.getOrThrow<string>('DO_PUBLIC_URL');

    this.cliente = new S3Client({
      endpoint: `https://${endpoint}`,
      region: 'us-east-1', // exigido pelo SDK; o Spaces ignora
      credentials: {
        accessKeyId: config.getOrThrow<string>('DO_KEY'),
        secretAccessKey: config.getOrThrow<string>('DO_SECRET'),
      },
      forcePathStyle: false,
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
    publico?: boolean;
  }): Promise<ArquivoEnviado> {
    const extensao = params.nomeOriginal.split('.').pop() ?? 'bin';
    const chave = `${params.officeId}/${randomUUID()}.${extensao}`;

    await this.cliente.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: chave,
        Body: params.conteudo,
        ContentType: params.mimetype,
        // Documentos jurídicos são privados por padrão. Público só quando
        // explicitamente pedido — um contrato acessível por URL adivinhável
        // seria vazamento.
        ACL: params.publico ? 'public-read' : 'private',
      }),
    );

    return {
      chave,
      url: params.publico ? `${this.urlPublica}/${chave}` : chave,
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
