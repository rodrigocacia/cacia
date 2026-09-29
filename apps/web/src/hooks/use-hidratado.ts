import { useSyncExternalStore } from "react"

const semAssinatura = () => () => {}

/**
 * `false` no HTML do servidor e até o React assumir a página; `true` depois.
 *
 * Serve para travar formulários sensíveis: enviado antes da hidratação, o
 * `<form>` segue o comportamento nativo do navegador, sem o `onSubmit` do
 * React. `useSyncExternalStore` em vez de `useEffect` + estado para não
 * renderizar duas vezes nem piscar o botão.
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    semAssinatura,
    () => true,
    () => false
  )
}
