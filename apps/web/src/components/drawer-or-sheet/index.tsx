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
import { AiOutlinePlus } from "react-icons/ai"
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
                className="cursor-pointer"
                iconLeft={<AiOutlinePlus size={20} />}
              >
                {triggerLabel}
              </Button>
            </SheetTrigger>
          )}
          <SheetContent className="min-w-[730px] border-none">
            <SheetTitle className="sr-only">Novo</SheetTitle>
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
          <DrawerTrigger
            className="md:hidden fixed w-[56px] h-[56px] bottom-6 right-6 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl z-50"
            onClick={onTriggerClick}
          >
            <Plus className="w-5 h-5" />
          </DrawerTrigger>
          <DrawerContent className=" border-none">
            <DrawerHeader>
              <DrawerTitle className="text-white text-xl font-semibold text-left">
                Solicitação de saque
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                Solicitação de saque
              </DrawerDescription>
            </DrawerHeader>

            {children}
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
