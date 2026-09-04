import { create } from "zustand"
import { addMonths, subMonths } from "date-fns"

interface CalendarStore {
  currentMonth: Date
  nextMonth: () => void
  prevMonth: () => void
  setMonth: (date: Date) => void
  resetMonth: () => void
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  currentMonth: new Date(),

  nextMonth: () =>
    set((state) => ({
      currentMonth: addMonths(state.currentMonth, 1),
    })),

  prevMonth: () =>
    set((state) => ({
      currentMonth: subMonths(state.currentMonth, 1),
    })),

  setMonth: (date) => set({ currentMonth: date }),

  resetMonth: () => set({ currentMonth: new Date() }),
}))
