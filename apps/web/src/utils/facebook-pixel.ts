declare global {
  interface Window {
    fbq: (
      action: "track" | "trackCustom" | "init",
      eventName: string,
      params?: Record<string, unknown>
    ) => void
  }
}

function isFbqAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function"
}

function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!isFbqAvailable()) {
    return
  }

  try {
    window.fbq("track", eventName, params || {})
  } catch (error) {
    console.error(
      `Erro ao disparar evento ${eventName} do Facebook Pixel:`,
      error
    )
  }
}

interface PurchaseParams {
  value: number
  currency: string
  content_name?: string
}

export function trackCompleteRegistration(): void {
  trackEvent("CompleteRegistration", {
    content_name: "Cadastro de Usuário",
  })
}

export function trackInitiateCheckout(params?: {
  value?: number
  currency?: string
}): void {
  trackEvent("InitiateCheckout", {
    value: params?.value || 129.9,
    currency: params?.currency || "BRL",
    content_name: "Plano BETA",
  })
}

export function trackPurchase(params?: PurchaseParams): void {
  trackEvent("Purchase", {
    value: params?.value || 129.9,
    currency: params?.currency || "BRL",
    content_name: params?.content_name || "Plano BETA",
  })
}
