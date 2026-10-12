/**
 * O que a moldura do onboarding mostra para cada etapa.
 *
 * A posição no array é o `step` do useOnboardingStore menos 1 (o passo 0 é
 * a boas-vindas, que não conta como etapa). Se a ordem em `steps/index.tsx`
 * mudar, esta lista muda junto.
 */
export interface PassoDoOnboarding {
  /** Nome curto, na lista lateral. */
  nome: string
  /** Pergunta que abre o painel do formulário. */
  titulo: string
  /** Linha de apoio abaixo do título. */
  descricao: string
  /** Manchete do painel escuro: o trecho em `destaque` vai em itálico. */
  manchete: { inicio: string; destaque: string }
}

export const PASSOS_DO_ONBOARDING: PassoDoOnboarding[] = [
  {
    nome: "Agenda",
    titulo: "Vamos configurar sua agenda?",
    descricao: "Eu organizo os compromissos. Você define como quer atender.",
    manchete: { inicio: "Configure sua", destaque: "agenda." },
  },
  {
    nome: "Tom com os clientes",
    titulo: "Como devo falar com seus leads e clientes?",
    descricao: "Escolha o estilo e a mensagem de boas-vindas.",
    manchete: { inicio: "Defina o tom para", destaque: "seus clientes." },
  },
  {
    nome: "Tom com você",
    titulo: "Como você quer que eu fale com você?",
    descricao: "O estilo das minhas mensagens internas e recados.",
    manchete: { inicio: "Defina como falo", destaque: "com você." },
  },
  {
    nome: "Consulta jurídica",
    titulo: "O atendimento jurídico possui custo?",
    descricao: "Informe se a consulta é cobrada e como o pagamento acontece.",
    manchete: { inicio: "Como funciona sua", destaque: "consulta jurídica." },
  },
  {
    nome: "Serviços",
    titulo: "Quais serviços você oferece?",
    descricao: "Uso como base para orçamentos e aprovação.",
    manchete: { inicio: "Cadastre seus", destaque: "serviços." },
  },
  {
    nome: "Dúvidas frequentes",
    titulo: "Quais dúvidas você mais recebe?",
    descricao: "Eu respondo as perguntas de sempre e você ganha tempo.",
    manchete: { inicio: "As dúvidas que", destaque: "mais chegam." },
  },
  {
    nome: "WhatsApp",
    titulo: "Pronto para começar? Conecte seu WhatsApp.",
    descricao: "É por aqui que falo com seus clientes.",
    manchete: { inicio: "Conecte seu", destaque: "WhatsApp." },
  },
  {
    nome: "Notificações",
    titulo: "Quais notificações devo enviar?",
    descricao:
      "Você recebe os avisos do escritório; seus clientes, os do caso deles.",
    manchete: { inicio: "O que devo", destaque: "avisar." },
  },
]

export const TOTAL_DE_PASSOS = PASSOS_DO_ONBOARDING.length

/** "03" — numeração em duas casas, como na lista lateral. */
export function numeroDoPasso(indice: number) {
  return String(indice + 1).padStart(2, "0")
}
