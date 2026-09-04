import { Injectable } from '@nestjs/common';
import { compare, hash } from '@node-rs/bcrypt';

@Injectable()
export class SenhaService {
  /**
   * Custo 12. Cada incremento dobra o tempo de cálculo — 12 leva ~250ms em
   * hardware atual, o que torna força bruta cara sem pesar no login.
   */
  private readonly custo = 12;

  gerarHash(senhaPura: string): Promise<string> {
    return hash(senhaPura, this.custo);
  }

  conferir(senhaPura: string, hashArmazenado: string): Promise<boolean> {
    return compare(senhaPura, hashArmazenado);
  }
}
