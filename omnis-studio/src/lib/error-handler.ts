import Swal from "sweetalert2"
import { ApiError } from "@/lib/api"

const themeClasses = () => {
  const isDark = document.documentElement.classList.contains("dark")
  return {
    popup: isDark
      ? "bg-[#18181B] text-[#FAFAFA] border border-[#27272A] rounded-xl shadow-2xl"
      : "bg-white text-[#111827] border border-[#E5E7EB] rounded-xl shadow-2xl",
    confirmButton: isDark
      ? "bg-[#6366f1] hover:bg-[#5558e6] text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50"
      : "bg-[#4f46e5] hover:bg-[#4338ca] text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/50",
    cancelButton: isDark
      ? "bg-[#27272A] hover:bg-[#3f3f46] text-[#A1A1AA] font-medium px-6 py-2.5 rounded-lg text-sm transition-colors"
      : "bg-[#F8F9FB] hover:bg-[#E5E7EB] text-[#6B7280] font-medium px-6 py-2.5 rounded-lg text-sm transition-colors",
    timer: isDark ? "#6366f1" : "#4f46e5",
  }
}

const errorConfigs: Record<number, { icon: "error" | "warning" | "info"; title: string; text: string; showConfirmButton?: boolean; showCancelButton?: boolean; confirmText?: string; cancelText?: string }> = {
  400: {
    icon: "warning",
    title: "Hmm, let's check that",
    text: "Something about your prompt or settings doesn't look right. Try tweaking it and go again.",
  },
  401: {
    icon: "info",
    title: "Session expired",
    text: "You've been signed out. Please log in again to continue.",
    showConfirmButton: true,
    confirmText: "Sign In",
    showCancelButton: true,
    cancelText: "Later",
  },
  402: {
    icon: "warning",
    title: "Not enough credits",
    text: "You don't have enough credits for this generation. Top up from the billing page.",
    showConfirmButton: true,
    confirmText: "Buy Credits",
    showCancelButton: true,
    cancelText: "Cancel",
  },
  403: {
    icon: "error",
    title: "Access denied",
    text: "You don't have permission to do that. If you think this is a mistake, contact support.",
  },
  404: {
    icon: "info",
    title: "Model unavailable",
    text: "That model isn't available right now. Please try a different model.",
  },
  409: {
    icon: "info",
    title: "Already exists",
    text: "This resource already exists. Try something else.",
  },
  422: {
    icon: "warning",
    title: "Prompt not accepted",
    text: "The AI provider couldn't process this prompt due to content safety filters. Try rephrasing it.",
  },
  429: {
    icon: "warning",
    title: "Slow down!",
    text: "You're generating too fast. Give it a moment and try again.",
  },
  500: {
    icon: "error",
    title: "Server hiccup",
    text: "Our servers hit a snag. Things should be back to normal shortly — try again.",
  },
  503: {
    icon: "error",
    title: "Service temporarily down",
    text: "Our AI provider is taking a breather. Give it a few minutes and try again.",
  },
  504: {
    icon: "warning",
    title: "Taking too long",
    text: "The generation timed out. This can happen during peak times — just try again.",
  },
}

const networkErrorConfig = {
  icon: "error" as const,
  title: "Connection lost",
  text: "Couldn't reach the server. Check your internet connection and try again.",
}

const fallbackConfig = {
  icon: "error" as const,
  title: "Something went wrong",
  text: "An unexpected error occurred. Please try again.",
}

export async function showSuccessToast(message: string): Promise<void> {
  const isDark = document.documentElement.classList.contains("dark")
  await Swal.fire({
    icon: "success",
    title: message,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: isDark ? "#18181B" : "#ffffff",
    color: isDark ? "#FAFAFA" : "#111827",
    iconColor: isDark ? "#6366f1" : "#4f46e5",
    customClass: {
      popup: [
        "!rounded-xl !shadow-2xl !border",
        isDark ? "!border-[#27272A]" : "!border-[#E5E7EB]",
        "!text-sm !font-medium !px-4 !py-3",
      ].join(" "),
    },
  })
}

export async function showGenerationError(error: unknown): Promise<void> {
  const styles = themeClasses()

  if (!(error instanceof ApiError)) {
    await Swal.fire({
      ...fallbackConfig,
      background: styles.popup,
      confirmButtonColor: styles.timer,
      customClass: {
        confirmButton: styles.confirmButton,
        popup: styles.popup.split(" ").slice(0, 2).join(" "),
      },
    })
    return
  }

  const config = errorConfigs[error.status] ?? (error.status === 0 ? networkErrorConfig : null)

  if (!config) {
    await Swal.fire({
      icon: "error",
      title: "Something went wrong",
      text: error.message || fallbackConfig.text,
      background: styles.popup,
      confirmButtonColor: styles.timer,
      customClass: {
        confirmButton: styles.confirmButton,
        popup: styles.popup.split(" ").slice(0, 2).join(" "),
      },
    })
    return
  }

  if (error.status === 401 || error.status === 402) {
    const result = await Swal.fire({
      icon: config.icon as "error" | "warning" | "info",
      title: config.title,
      text: config.text,
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: config.confirmText,
      cancelButtonText: config.cancelText,
      background: styles.popup,
      confirmButtonColor: styles.timer,
      cancelButtonColor: "#6B7280",
      reverseButtons: true,
      customClass: {
        confirmButton: styles.confirmButton,
        cancelButton: styles.cancelButton,
        popup: styles.popup.split(" ").slice(0, 2).join(" "),
      },
    })

    if (result.isConfirmed) {
      if (error.status === 401) {
        const { clearStoredToken } = await import("@/lib/api")
        clearStoredToken()
        window.location.href = "/login"
      } else if (error.status === 402) {
        window.location.href = "/dashboard/billing"
      }
    }
    return
  }

  await Swal.fire({
    icon: config.icon as "error" | "warning" | "info",
    title: config.title,
    text: config.text,
    background: styles.popup,
    confirmButtonColor: styles.timer,
    customClass: {
      confirmButton: styles.confirmButton,
      popup: styles.popup.split(" ").slice(0, 2).join(" "),
    },
  })
}
