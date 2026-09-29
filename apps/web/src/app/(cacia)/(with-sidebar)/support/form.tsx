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
    <div className="px-4 pb-6 w-full">
      <div className="mt-10 flex flex-col gap-3">
        <h3 className="text-xl text-[#3D3D3D] font-bold">
          Falar com o suporte
        </h3>

        {email ? (
          <p className="text-base text-[#707070]">
            Ficou alguma dúvida ou surgiu algum problema? Escreva para{" "}
            <a
              href={`mailto:${email}`}
              className="text-[#348C98] font-semibold underline"
            >
              {email}
            </a>{" "}
            contando o que aconteceu — nosso time de suporte ficará feliz em te
            ajudar.
          </p>
        ) : (
          <p className="text-base text-[#707070]">
            O canal de suporte ainda não foi configurado. Fale com o responsável
            pela sua conta na CacIA.
          </p>
        )}
      </div>
    </div>
  )
}
