import { ReactNode } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "../ui/custom-button"
import { Plus } from "lucide-react"

interface DrawerOrSheetProps {
  children: ReactNode
  open: boolean
  close(): void
  hasTrigger: boolean
  triggerLabel: string
  onTriggerClick: () => void
}

export function DrawerOrSheet({
  children,
  open,
  close,
  hasTrigger = true,
  triggerLabel,
  onTriggerClick,
}: DrawerOrSheetProps) {
  const isMobile = useIsMobile()
  const isOpenDialog = open && !isMobile
  const isOpenDrawer = open && isMobile

  return (
    <div>
      <div className="h-full max-md:hidden">
        <Sheet
          open={isOpenDialog}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              close()
            }
          }}
        >
          {hasTrigger && (
            <SheetTrigger asChild>
              <Button
                onClick={onTriggerClick}
                type="button"
                className="h-10! cursor-pointer px-4 text-[13.5px]"
                iconLeft={<Plus size={16} strokeWidth={2} />}
              >
                {triggerLabel}
              </Button>
            </SheetTrigger>
          )}
          <SheetContent className="min-w-[640px] px-8">
            <SheetTitle className="sr-only">{triggerLabel}</SheetTitle>
            {children}
          </SheetContent>
        </Sheet>
      </div>

      <div className="md:hidden">
        <Drawer
          open={isOpenDrawer}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              close()
            }
          }}
        >
          {hasTrigger && (
            <DrawerTrigger
              aria-label={triggerLabel}
              className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-acao text-white shadow-[0_10px_24px_rgba(21,19,17,0.22)] transition-colors hover:bg-acao-escura md:hidden"
              onClick={onTriggerClick}
            >
              <Plus className="h-5 w-5" strokeWidth={2} />
            </DrawerTrigger>
          )}
          <DrawerContent className="px-4">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{triggerLabel}</DrawerTitle>
              <DrawerDescription>{triggerLabel}</DrawerDescription>
            </DrawerHeader>

            {children}
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
