import { Mail } from "lucide-react"

import { Cartao } from "../setting/_ui/cartao"

/**
 * Canal de suporte.
 *
 * Havia aqui um formulário cujo "Enviar" não fazia nada — não existe backend
 * de suporte, e a mensagem do cliente se perdia sem aviso. Até existir, a tela
 * aponta para um e-mail. O endereço vem de configuração, e não do código, para
 * não publicar um contato que ninguém lê: sem ele, a tela diz que o canal
 * ainda não foi configurado em vez de oferecer um envio falso.
 */
export function Form() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()

  return (
    <Cartao titulo="Falar com o suporte">
      {email ? (
        <div className="flex flex-col gap-5">
          <p className="text-[14.5px] leading-relaxed text-tinta-2">
            Ficou alguma dúvida ou surgiu algum problema? Escreva contando o que
            aconteceu — nosso time de suporte ficará feliz em te ajudar.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-filete pt-5">
            <span className="flex min-w-0 items-center gap-2.5 text-[14px] text-tinta">
              <Mail
                size={16}
                strokeWidth={1.7}
                className="shrink-0 text-tinta-3"
                aria-hidden
              />
              <span className="truncate font-medium">{email}</span>
            </span>

            <a
              href={`mailto:${email}`}
              className="inline-flex h-9 items-center gap-2 rounded-[9px] bg-acao px-3.5 text-[13.5px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-acao-escura"
            >
              Escrever e-mail
            </a>
          </div>
        </div>
      ) : (
        <p className="text-[14.5px] leading-relaxed text-tinta-2">
          O canal de suporte ainda não foi configurado. Fale com o responsável
          pela sua conta na CacIA.
        </p>
      )}
    </Cartao>
  )
}
