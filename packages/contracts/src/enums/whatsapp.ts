/**
 * Provedor de WhatsApp usado por uma conexão.
 *
 * Hoje duplicado em 3 repositórios; aqui passa a ter definição única.
 */
export enum WhatsappProvider {
  OFICIAL = 'oficial',
  EVOLUTION = 'evolution',
  WAHA = 'waha',
}

/** Estado de uma sessão WAHA, conforme reportado pela própria API do WAHA. */
export enum WahaSessionStatus {
  STOPPED = 'STOPPED',
  STARTING = 'STARTING',
  SCAN_QR_CODE = 'SCAN_QR_CODE',
  WORKING = 'WORKING',
  FAILED = 'FAILED',
}

/**
 * Abrangência geográfica efetivamente aplicada ao proxy residencial.
 *
 * A resolução tenta cidade, cai para estado e depois para país — o valor
 * armazenado é o nível que de fato funcionou, não o que foi pedido.
 */
export enum ProxyScope {
  CITY = 'city',
  STATE = 'state',
  COUNTRY = 'country',
}
