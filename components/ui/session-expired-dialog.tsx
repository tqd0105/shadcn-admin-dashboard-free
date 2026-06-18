"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/**
 * Reusable modal that informs the user their session has expired.
 * Uses the generic shadcn/ui Dialog component for visual consistency.
 */
export default function SessionExpiredDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()

  const handleLogin = () => {
    onOpenChange(false)
    // Ensure any stale auth is cleared before navigating
    router.replace("/login")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={false}>
        <DialogHeader className="text-center">
          <DialogTitle>Authentication Required</DialogTitle>
          <DialogDescription>
            Your session has expired or you are not logged in. Please log in to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center">
          <Button onClick={handleLogin}>Log in</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
