"use client"

import { useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import SessionExpiredDialog from "@/components/ui/session-expired-dialog"

/**
 * Connects the AuthContext's `sessionExpired` flag to the reusable dialog.
 * When the flag becomes true, the dialog is shown. Closing the dialog (by clicking
 * the button) will navigate to the login page via the dialog's own handler.
 */
export default function SessionExpiredModal() {
  const { sessionExpired, setSessionExpired } = useAuth()

  // Reset the flag when the component is unmounted or when the user navigates away
  useEffect(() => {
    if (!sessionExpired) return
    // Ensure flag is cleared after showing once to avoid repeated modals
    return () => setSessionExpired(false)
  }, [sessionExpired, setSessionExpired])

  return (
    <SessionExpiredDialog
      open={sessionExpired}
      onOpenChange={setSessionExpired}
    />
  )
}
