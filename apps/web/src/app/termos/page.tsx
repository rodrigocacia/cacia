import Image from "next/image"

export default function TermosPage() {
  return (
    <div className="w-full min-h-screen px-8 py-10 max-lg:px-4 max-lg:py-6">
      <main className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-center mb-8">
          <Image src="/logo-cacia.png" alt="CacIA" width={110} height={32} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8 max-lg:p-6">
          <h1 className="text-3xl font-bold text-[#3D3D3D] mb-8">
            Termo de Uso – ADVAI
          </h1>

          <div className="space-y-6 text-[#707070] leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                1. Considerações Iniciais
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  1.1 Aceitação dos Termos
                </h3>
                <p>
                  Ao acessar ou utilizar os serviços da ADVAI, o advogado
                  declara ter lido, compreendido e concordado com todos os
                  termos e condições estabelecidos neste documento. A utilização
                  dos serviços pressupõe aceitação integral e irrestrita deste
                  Termo de Uso.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                2. Descrição dos Serviços
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-[#3D3D3D] mb-2">
                    2.1 Funcionalidades da Assistente Cacia
                  </h3>
                  <p>
                    A assistente virtual Cacia atua via WhatsApp para
                    atendimento automatizado, realizando classificação de leads,
                    consultas processuais, agendamentos via Google Calendar,
                    coleta de documentos e repasse de informações financeiras
                    aos clientes do advogado.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#3D3D3D] mb-2">
                    2.2 Funcionalidades da Plataforma Web e Mobile
                  </h3>
                  <p>
                    A plataforma ADVAI oferece ao advogado um painel com
                    dashboards, cadastros e relatórios de leads, clientes,
                    agendamentos, processos, feedbacks, e organização de
                    documentos por cliente. Há também um painel de administração
                    (backoffice) para a gestão geral da plataforma e dos
                    parceiros.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                3. Cadastro e Obrigações do Usuário
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  3.1 Responsabilidades do Advogado
                </h3>
                <p>
                  O advogado é responsável por fornecer dados corretos, manter a
                  confidencialidade de informações sensíveis, garantir o
                  consentimento dos clientes sobre os dados tratados e utilizar
                  a plataforma conforme a legislação vigente.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                4. Limitações e Isenções de Responsabilidade
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  4.1 Natureza dos Dados e Consultas
                </h3>
                <p>
                  As informações retornadas pela assistente Cacia são oriundas
                  de fontes públicas e podem estar sujeitas a instabilidades. A
                  ADVAI não garante precisão ou atualização em tempo real, nem
                  realiza análise jurídica dos dados.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                5. Propriedade Intelectual
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  5.1 Direitos da Plataforma
                </h3>
                <p>
                  Todos os elementos que compõem a plataforma ADVAI, incluindo
                  sua identidade visual, código, textos e a assistente Cacia,
                  são protegidos por direitos autorais e não podem ser
                  utilizados sem autorização prévia e expressa.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                6. Encerramento e Cancelamento
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  6.1 Rescisão Contratual
                </h3>
                <p>
                  O advogado poderá solicitar o encerramento do serviço a
                  qualquer momento. A ADVAI se reserva o direito de suspender ou
                  encerrar o acesso em caso de violação destes termos ou uso
                  indevido da plataforma.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                7. Modificações no Termo de Uso
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  7.1 Atualizações
                </h3>
                <p>
                  Este termo poderá ser atualizado a qualquer tempo, mediante
                  aviso prévio via WhatsApp ou outros canais de comunicação
                  utilizados pela plataforma.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#3D3D3D] mb-4">
                8. Contato
              </h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-[#3D3D3D]">
                  8.1 Suporte
                </h3>
                <p>
                  Dúvidas relacionadas a este Termo de Uso devem ser
                  encaminhadas para{" "}
                  <a
                    href="mailto:contato@advai.com.br"
                    className="text-[#348C98] hover:underline"
                  >
                    contato@advai.com.br
                  </a>{" "}
                  ou via atendimento direto pelo WhatsApp institucional.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
