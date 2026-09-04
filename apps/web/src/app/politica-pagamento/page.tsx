import Image from "next/image"

export default function PoliticaPagamentoPage() {
  return (
    <div className="w-full min-h-screen px-8 py-10 max-lg:px-4 max-lg:py-6">
      <main className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <Image src="/logo-cacia.png" alt="CacIA" width={110} height={32} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8 max-lg:p-6">
          <h1 className="text-3xl font-bold text-[#3D3D3D] mb-8">
            Política de Pagamento – ADVAI
          </h1>

          <div className="space-y-6 text-[#707070] leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                1. Modalidades de Pagamento
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  1.1 Meios Aceitos
                </h3>
                <p>
                  A ADVAI disponibiliza atualmente os seguintes meios de
                  pagamento para contratação dos serviços: (i) Pix; (ii) Cartão
                  de Crédito. A escolha da forma de pagamento é feita pelo
                  advogado no momento da contratação via atendimento pelo
                  WhatsApp.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                2. Planos e Renovação
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[#3D3D3D] mb-2">
                    2.1 Tipos de Plano
                  </h3>
                  <p>
                    Os serviços da ADVAI são oferecidos em planos mensais ou
                    anuais, cujos valores, funcionalidades e condições são
                    apresentados previamente ao advogado no ato da contratação.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#3D3D3D] mb-2">
                    2.2 Renovação Automática
                  </h3>
                  <p>
                    Os planos podem incluir renovação automática. Caso deseje
                    cancelar antes da renovação, o advogado deverá comunicar
                    formalmente com antecedência mínima de 3 dias úteis antes da
                    data de renovação.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                3. Cancelamento e Reembolso
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[#3D3D3D] mb-2">
                    3.1 Período de Garantia
                  </h3>
                  <p>
                    Nos termos do Código de Defesa do Consumidor, o advogado
                    poderá cancelar o serviço em até 7 dias corridos após a
                    contratação inicial, com direito a reembolso integral do
                    valor pago.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#3D3D3D] mb-2">
                    3.2 Reembolso Parcial ou Estornos
                  </h3>
                  <p>
                    Após o período de garantia, não haverá reembolso
                    proporcional. Estornos em cartão de crédito seguirão os
                    prazos da operadora, não sendo de responsabilidade da ADVAI
                    eventuais atrasos.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                4. Suspensão por Inadimplência
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  4.1 Falta de Pagamento
                </h3>
                <p>
                  O não pagamento na data de vencimento implicará na suspensão
                  automática dos serviços, incluindo o acesso à assistente Cacia
                  e aos painéis da plataforma. A retomada do serviço estará
                  condicionada à quitação dos valores devidos.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                5. Prevenção a Fraudes
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  5.1 Monitoramento e Medidas
                </h3>
                <p>
                  A ADVAI monitora continuamente suas operações para prevenir
                  fraudes. Qualquer indício de uso fraudulento, como clonagem de
                  WhatsApp ou pagamentos indevidos, poderá gerar suspensão ou
                  cancelamento da conta do advogado, independentemente de aviso
                  prévio.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                6. Alterações na Política de Pagamento
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  6.1 Atualizações
                </h3>
                <p>
                  Esta política poderá ser atualizada a qualquer momento. As
                  alterações serão comunicadas ao advogado via WhatsApp ou
                  canais institucionais da ADVAI. O uso continuado da plataforma
                  após a notificação implicará aceite automático das novas
                  condições.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                7. Contato Financeiro
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  7.1 Suporte para Cobrança
                </h3>
                <p>
                  Dúvidas sobre valores, planos, pagamentos ou reembolsos podem
                  ser tratadas pelo canal financeiro oficial:{" "}
                  <a
                    href="mailto:financeiro@advai.com.br"
                    className="text-[#348C98] hover:underline"
                  >
                    financeiro@advai.com.br
                  </a>{" "}
                  ou via WhatsApp da plataforma.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
