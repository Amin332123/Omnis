"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import {
  Palette, Bell, Trash2, Sun, Moon, Monitor,
  Camera, Loader2, CheckCircle2, AlertCircle, X,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/auth-context"
import { uploadAvatar, updateNotificationPrefs, deleteAccount } from "@/lib/auth-api"
import { showSuccessToast } from "@/lib/error-handler"
import { getApiErrorMessage } from "@/lib/api"
import Swal from "sweetalert2"

const AVATAR_MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, loadCurrentUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null)
  const [displayNameInput, setDisplayNameInput] = useState("")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initials = user?.initials ?? ""
  const email = user?.email ?? ""

  useEffect(() => {
    if (user) {
      setDisplayNameInput(user.displayName ?? user.email ?? "Account")
      if (user.emailNotifications !== undefined) setEmailNotifications(user.emailNotifications)
      if (user.marketingEmails !== undefined) setMarketingEmails(user.marketingEmails)
    }
  }, [user])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleAvatarClick = () => {
    if (saving) return
    fileInputRef.current?.click()
  }

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    setSavedAvatarUrl(null)
    setSaveError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return "Please select a valid image (JPEG, PNG, GIF, or WebP)."
    if (file.size > AVATAR_MAX_SIZE) return "File is too large. Maximum size is 5MB."
    return null
  }

  const handleNotificationToggle = async (key: "emailNotifications" | "marketingEmails", value: boolean) => {
    const setter = key === "emailNotifications" ? setEmailNotifications : setMarketingEmails
    setter(value)
    try {
      await updateNotificationPrefs({ [key]: value })
      showSuccessToast(key === "emailNotifications" ? "Email notifications updated" : "Marketing emails updated")
    } catch {
      setter(!value)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSaveError(null)
    setSaveSuccess(false)
    const validationError = validateFile(file)
    if (validationError) {
      setSaveError(validationError)
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      if (selectedFile) {
        const result = await uploadAvatar(selectedFile)
        setSavedAvatarUrl(result.avatarUrl)
        await loadCurrentUser()
      }
      setSaveSuccess(true)
      setSelectedFile(null)
      if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
      if (fileInputRef.current) fileInputRef.current.value = ""
      showSuccessToast("Settings saved!")
    } catch (err) {
      setSaveError(getApiErrorMessage(err, "Failed to save. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const isDark = document.documentElement.classList.contains("dark")

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Account?",
      text: "This action cannot be undone. Your account and all associated data will be permanently deleted.",
      showCancelButton: true,
      confirmButtonText: "Yes, delete my account",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      background: isDark ? "#18181B" : "#ffffff",
      color: isDark ? "#FAFAFA" : "#111827",
      iconColor: "#ef4444",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: isDark ? "#27272A" : "#F8F9FB",
      customClass: {
        popup: [
          "!rounded-xl !shadow-2xl !border",
          isDark ? "!border-[#27272A]" : "!border-[#E5E7EB]",
        ].join(" "),
        confirmButton: [
          "!bg-[#ef4444] hover:!bg-[#dc2626] !text-white !font-medium !px-6 !py-2.5 !rounded-lg !text-sm !transition-colors !border-0 !shadow-none",
        ].join(" "),
        cancelButton: isDark
          ? "!bg-[#27272A] hover:!bg-[#3f3f46] !text-[#A1A1AA] !font-medium !px-6 !py-2.5 !rounded-lg !text-sm !transition-colors !border-0 !shadow-none"
          : "!bg-[#F8F9FB] hover:!bg-[#E5E7EB] !text-[#6B7280] !font-medium !px-6 !py-2.5 !rounded-lg !text-sm !transition-colors !border-0 !shadow-none",
      },
    })

    if (!result.isConfirmed) return

    try {
      await deleteAccount()
      await Swal.fire({
        icon: "success",
        title: "Account deleted",
        text: "Your account has been successfully deleted. You will be redirected.",
        background: isDark ? "#18181B" : "#ffffff",
        color: isDark ? "#FAFAFA" : "#111827",
        confirmButtonColor: "#6366f1",
        customClass: {
          popup: [
            "!rounded-xl !shadow-2xl !border",
            isDark ? "!border-[#27272A]" : "!border-[#E5E7EB]",
          ].join(" "),
          confirmButton: isDark
            ? "!bg-[#6366f1] hover:!bg-[#5558e6] !text-white !font-medium !px-6 !py-2.5 !rounded-lg !text-sm !transition-colors !border-0 !shadow-none"
            : "!bg-[#4f46e5] hover:!bg-[#4338ca] !text-white !font-medium !px-6 !py-2.5 !rounded-lg !text-sm !transition-colors !border-0 !shadow-none",
        },
      })
      const { clearStoredToken } = await import("@/lib/api")
      clearStoredToken()
      window.location.href = "/login"
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to delete account. Please try again.")
      await Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: message,
        background: isDark ? "#18181B" : "#ffffff",
        color: isDark ? "#FAFAFA" : "#111827",
        confirmButtonColor: "#6366f1",
        customClass: {
          popup: [
            "!rounded-xl !shadow-2xl !border",
            isDark ? "!border-[#27272A]" : "!border-[#E5E7EB]",
          ].join(" "),
          confirmButton: isDark
            ? "!bg-[#6366f1] hover:!bg-[#5558e6] !text-white !font-medium !px-6 !py-2.5 !rounded-lg !text-sm !transition-colors !border-0 !shadow-none"
            : "!bg-[#4f46e5] hover:!bg-[#4338ca] !text-white !font-medium !px-6 !py-2.5 !rounded-lg !text-sm !transition-colors !border-0 !shadow-none",
        },
      })
    }
  }

  const avatarSrc = savedAvatarUrl ?? previewUrl ?? user?.avatarUrl ?? undefined

  const SectionCard = ({ index, children, className = "" }: { index: number; children: React.ReactNode; className?: string }) => (
    <motion.div variants={cardVariants} className={className}>
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/10 via-transparent to-accent/5 rounded-xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
        {children}
      </div>
    </motion.div>
  )

  return (
    <div className="relative min-h-full">
      {/* Background glow orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent/5 dark:bg-accent/[0.04] blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/5 dark:bg-accent/[0.04] blur-3xl animate-pulse" style={{ animationDuration: "12s", animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 dark:bg-accent/[0.04] blur-3xl animate-pulse" style={{ animationDuration: "15s", animationDelay: "4s" }} />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 max-w-3xl relative"
      >
        {/* Header */}
        <motion.div variants={cardVariants} className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-1 rounded-full bg-accent" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
          </div>
          <p className="text-muted text-sm ml-[18px]">Manage your account settings and preferences</p>
        </motion.div>

        {/* Profile Card */}
        <SectionCard index={0}>
          <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-accent/5 dark:hover:shadow-accent/[0.03]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="relative" onClick={handleAvatarClick}>
                <div className={`rounded-full transition-shadow ${selectedFile ? "ring-2 ring-accent ring-offset-2 ring-offset-card shadow-lg shadow-accent/20" : "ring-2 ring-border ring-offset-2 ring-offset-card"}`}>
                  <Avatar className="h-14 w-14 cursor-pointer">
                    <AvatarImage src={avatarSrc} className="object-cover" />
                    <AvatarFallback className="text-lg bg-gradient-to-br from-accent/10 to-accent/5 text-accent cursor-pointer">{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-white" />
                </motion.div>
                <AnimatePresence>
                  {selectedFile && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      whileHover={{ scale: 1.15 }}
                      onClick={(e) => { e.stopPropagation(); clearSelectedFile() }}
                      className="absolute -top-1 -right-1 bg-error text-white rounded-full p-0.5 shadow-md hover:bg-error/90 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleFileChange} />
              <div className="flex-1 min-w-0">
                <CardTitle className="truncate">{displayNameInput}</CardTitle>
                <CardDescription>{email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-xs text-accent bg-accent/5 border border-accent/20 rounded-lg px-3 py-2.5 overflow-hidden"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <span>New photo selected — click <strong>Save Changes</strong> to upload</span>
                  </motion.div>
                )}

                {saveError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-xs text-error bg-error/5 border border-error/10 rounded-lg px-3 py-2.5 overflow-hidden"
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{saveError}</span>
                  </motion.div>
                )}

                {saveSuccess && !selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-xs text-success bg-success/5 border border-success/20 rounded-lg px-3 py-2.5 overflow-hidden"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Settings saved successfully</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" value={displayNameInput} onChange={(e) => setDisplayNameInput(e.target.value)} className="transition-shadow focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-accent/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-address">Email</Label>
                  <Input id="email-address" type="email" defaultValue={email} disabled className="opacity-50 cursor-not-allowed" />
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button size="sm" onClick={handleSave} disabled={saving} className="relative overflow-hidden">
                  {saving ? (
                    <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...</>
                  ) : "Save Changes"}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </SectionCard>

        {/* Appearance Card */}
        <SectionCard index={1}>
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-accent/5 dark:hover:shadow-accent/[0.03]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-accent/10">
                  <Palette className="h-4 w-4 text-accent" />
                </div>
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize how Omnis Studio looks for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Theme</Label>
                <div className="flex items-center gap-3">
                  {[
                    { id: "light", icon: Sun, label: "Light" },
                    { id: "dark", icon: Moon, label: "Dark" },
                    { id: "system", icon: Monitor, label: "System" },
                  ].map(({ id, icon: Icon, label }) => (
                    <motion.button
                      key={id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setTheme(id)}
                      className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm transition-all flex-1 justify-center ${
                        theme === id
                          ? "border-accent bg-accent/5 text-foreground shadow-sm shadow-accent/10"
                          : "border-border text-muted hover:border-accent/40 hover:text-foreground hover:bg-accent/[0.02]"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${theme === id ? "text-accent" : ""}`} />
                      {label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionCard>

        {/* Notifications Card */}
        <SectionCard index={2}>
          <Card className="border-border/60 bg-card/80 backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-accent/5 dark:hover:shadow-accent/[0.03]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-accent/10">
                  <Bell className="h-4 w-4 text-accent" />
                </div>
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between group rounded-lg p-3 -mx-3 transition-colors hover:bg-accent/[0.02]">
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">Email Notifications</p>
                  <p className="text-xs text-muted mt-0.5">Receive emails about generation completions</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={(v) => handleNotificationToggle("emailNotifications", v)} />
              </div>
              <Separator className="opacity-50" />
              <div className="flex items-center justify-between group rounded-lg p-3 -mx-3 transition-colors hover:bg-accent/[0.02]">
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">Marketing Emails</p>
                  <p className="text-xs text-muted mt-0.5">Receive updates about new features and offers</p>
                </div>
                <Switch checked={marketingEmails} onCheckedChange={(v) => handleNotificationToggle("marketingEmails", v)} />
              </div>
            </CardContent>
          </Card>
        </SectionCard>

        {/* Danger Zone */}
        <SectionCard index={3}>
          <Card className="border-error/20 bg-card/80 backdrop-blur-sm transition-shadow duration-300 hover:shadow-lg hover:shadow-error/5">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-error/20 to-transparent" />
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-error/10">
                  <Trash2 className="h-4 w-4 text-error" />
                </div>
                <CardTitle className="text-error">Danger Zone</CardTitle>
              </div>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-error/5 border border-error/10 transition-colors hover:bg-error/[0.07]">
                <div>
                  <p className="text-sm font-medium text-foreground">Delete Account</p>
                  <p className="text-xs text-muted mt-0.5">Permanently delete your account and all data</p>
                </div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button variant="destructive" size="sm" onClick={() => void handleDeleteAccount()}>Delete Account</Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </SectionCard>

        {/* Bottom spacing */}
        <div className="h-4" />
      </motion.div>
    </div>
  )
}
