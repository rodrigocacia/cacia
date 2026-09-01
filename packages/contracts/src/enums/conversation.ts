/** Com quem a conversa acontece. */
export enum ChatType {
  USER = "user",
  LEAD = "lead",
  CUSTOMER = "customer",
}

/** Quem enviou a mensagem. */
export enum MessageSender {
  USER = "user",
  AGENT = "agent",
  CONTACT = "contact",
}

/** Formato do conteúdo da mensagem. */
export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  AUDIO = "audio",
  VIDEO = "video",
  DOCUMENT = "document",
  LOCATION = "location",
}
