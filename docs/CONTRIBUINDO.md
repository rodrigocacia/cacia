# Contribuindo

## Fluxo de trabalho

`main` está sempre publicável. Nada é enviado diretamente para ela.

```
main ──┬── feat/nome-da-funcionalidade ──▶ PR ──▶ revisão ──▶ merge
       ├── fix/descricao-do-problema
       ├── chore/tarefa-de-manutencao
       └── docs/o-que-foi-documentado
```

### Prefixos de branch

| Prefixo     | Uso                                       |
| ----------- | ----------------------------------------- |
| `feat/`     | Funcionalidade nova                       |
| `fix/`      | Correção de defeito                       |
| `refactor/` | Mudança interna sem alterar comportamento |
| `chore/`    | Build, dependências, configuração         |
| `docs/`     | Somente documentação                      |
| `test/`     | Somente testes                            |

---

## Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/pt-br/).

```
<tipo>(<escopo opcional>): <descrição no imperativo>

<corpo opcional — o PORQUÊ, não o o quê>
```

**Exemplos:**

```
feat(waha): aplicar proxy residencial na criação da sessão

Toda conexão nova nascia sem proxy e saía pelo IP do datacenter,
o que expõe os números a bloqueio pela Meta.
```

```
fix(reminder): remover janela de 5 minutos na busca de lembretes

A consulta só encontrava lembretes disparados nos últimos 5 minutos.
Qualquer indisponibilidade nesse intervalo perdia o lembrete em
definitivo, sem nenhum alerta.
```

A descrição diz **o que muda**. O corpo diz **por quê** — essa é a parte que o
código não consegue expressar sozinho.

---

## Pull Requests

Todo PR precisa de:

- **Título** no padrão de commit convencional
- **Descrição** com contexto: qual problema resolve e por quê desta forma
- **CI verde** — lint, typecheck, build e formatação
- **Escopo único** — um PR resolve uma coisa

### Modelo de descrição

```markdown
## O que muda

Resumo objetivo da alteração.

## Por quê

O problema que motivou. Referência ao arquivo e linha quando aplicável.

## Como testar

Passos para verificar o comportamento.

## Riscos

O que pode quebrar. "Nenhum" é resposta válida, desde que verdadeira.
```

---

## Padrões de código

**A formatação não se discute.** Prettier e ESLint decidem; rode `pnpm format`
antes de abrir o PR.

**Comentário explica o porquê, nunca o quê.** Se o código precisa de comentário
para ser entendido, normalmente o código é que precisa mudar. Comentário bom
registra a decisão, a restrição externa ou a armadilha não óbvia:

```ts
// Proxy só é aplicado em socket novo — reinicia a sessão para valer.
// Seguro mesmo com a sessão ativa: o WAHA reconecta com o auth salvo.
```

**Nada de duplicação entre pacotes.** Se um tipo é usado pela API e por um
frontend, ele vive em `packages/contracts`. A duplicação de schemas foi o
principal problema da arquitetura anterior — não vamos reintroduzi-la.

**O escritório vem do `TenantGuard`, nunca do cliente.** Em um controller,
a única forma legítima de obter o escritório é o decorator `@CurrentOffice()`:

```ts
@Get()
async listar(@CurrentOffice() officeId: string) {
  return this.service.listar(officeId);
}
```

Nunca leia `officeId` do corpo, da query ou do parâmetro de rota — esses valores
vêm do cliente e não passam por validação de vínculo. O guard resolve o
escritório a partir do cabeçalho `x-office-id` e confirma que o usuário é membro
dele antes de a rota executar.

Rotas que legitimamente não pertencem a um escritório declaram `@SkipTenant()`.
Se a rota lê ou escreve qualquer dado de escritório, ela **não** pode usar esse
decorator.

**Toda consulta filtra por `office_id`.** É a fronteira entre clientes. Um
esquecimento aqui vaza dado sigiloso de um escritório para outro.

---

## Antes de abrir o PR

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm build
```

Se passar localmente, passa no CI.
