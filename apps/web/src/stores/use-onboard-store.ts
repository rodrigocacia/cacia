import { create } from "zustand"
import { persist } from "zustand/middleware"

interface OnboardingStore {
  step: number
  nextStep: () => void
  prevStep: () => void
  setStep: (step: number) => void
  resetStep: () => void
  isFirstStep: () => boolean
  isLastStep: (maxStep: number) => boolean
}

export const useOnboardingStore = create(
  persist<OnboardingStore>(
    (set, get) => ({
      step: 0,

      nextStep: () => set((state) => ({ step: state.step + 1 })),

      prevStep: () => set((state) => ({ step: Math.max(state.step - 1, 0) })),

      setStep: (step) => set({ step }),

      resetStep: () => set({ step: 0 }),

      isFirstStep: () => get().step === 0,

      isLastStep: (maxStep: number) => get().step === maxStep,
    }),
    {
      name: "onboarding-storage",
    }
  )
)
