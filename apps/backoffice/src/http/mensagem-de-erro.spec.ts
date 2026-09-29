import { describe, expect, it } from 'vitest';

import { mensagemDeErro } from './mensagem-de-erro';

describe('mensagemDeErro', () => {
  it('usa a mensagem da API quando é texto', () => {
    expect(mensagemDeErro({ message: 'Senha atual incorreta' }, 'x')).toBe(
      'Senha atual incorreta',
    );
  });

  it('junta a lista do ValidationPipe em frases', () => {
    expect(
      mensagemDeErro(
        { message: ['Informe a senha atual', 'Senha curta'] },
        'x',
      ),
    ).toBe('Informe a senha atual. Senha curta');
  });

  it('cai no padrão quando o corpo não traz mensagem', () => {
    expect(mensagemDeErro(null, 'Erro ao atualizar senha')).toBe(
      'Erro ao atualizar senha',
    );
    expect(mensagemDeErro({ message: [] }, 'padrão')).toBe('padrão');
  });
});
