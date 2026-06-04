"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Users, Shield, Trash2, RefreshCw, CreditCard, KeyRound } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { getAdminStats, getAdminUsers, getCreditsUsageSeries, getNewUsersSeries, updateUserCredits, deleteUser, resetUserPassword } from "@/lib/admin-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { StatCard } from "@/components/dashboard/stat-card"
import { SimpleLineChart } from "@/components/dashboard/admin/simple-line-chart"
import type { AdminStatsResponse, AdminUser } from "@/lib/admin-api"

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [stats, setStats] = useState<AdminStatsResponse | null>(null)
  const [creditsSeries, setCreditsSeries] = useState<Array<{ date: string; creditsUsed: number }>>([])
  const [newUsersSeries, setNewUsersSeries] = useState<Array<{ date: string; newUsers: number }>>([])

  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [query, setQuery] = useState("")
  const [totalUsers, setTotalUsers] = useState(0)
  const [users, setUsers] = useState<AdminUser[]>([])

  const [creditDialogOpen, setCreditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [creditsDraft, setCreditsDraft] = useState<number>(0)
  const [isSavingCredits, setIsSavingCredits] = useState(false)

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwordSelectedUser, setPasswordSelectedUser] = useState<AdminUser | null>(null)
  const [passwordDraft, setPasswordDraft] = useState("")
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const isAdmin = !!user?.isAdmin

  useEffect(() => {
    if (isLoading) return
    if (!user) return
    if (!user.isAdmin) router.replace("/dashboard")
  }, [isLoading, user, router])

  const refreshAll = async () => {
    setIsLoadingStats(true)
    setIsLoadingUsers(true)
    try {
      const [s, credits, newUsers] = await Promise.all([
        getAdminStats(),
        getCreditsUsageSeries(14),
        getNewUsersSeries(14),
      ])
      setStats(s)
      setCreditsSeries(credits)
      setNewUsersSeries(newUsers)

      const list = await getAdminUsers({ page, pageSize, query })
      setUsers(list.users)
      setTotalUsers(list.total)
    } finally {
      setIsLoadingStats(false)
      setIsLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (!user?.isAdmin) return
    void refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.isAdmin, page, query])

  const creditUsagePoints = useMemo(
    () =>
      creditsSeries.map((p) => ({
        label: p.date.slice(5),
        value: p.creditsUsed,
      })),
    [creditsSeries],
  )

  const newUsersPoints = useMemo(
    () =>
      newUsersSeries.map((p) => ({
        label: p.date.slice(5),
        value: p.newUsers,
      })),
    [newUsersSeries],
  )

  const dashboardStats = useMemo(() => {
    const s = stats
    if (!s) return []
    return [
      { label: "Total Users", value: s.totalUsers, icon: "layers" as const },
      { label: "Credits Total", value: s.creditsTotal, icon: "sparkles" as const },
      { label: "Credits Used", value: s.totalCreditsUsed, icon: "image" as const },
      { label: "Total Generations", value: s.totalGenerations, icon: "video" as const },
    ]
  }, [stats])

  const openCreditsDialog = (u: AdminUser) => {
    setSelectedUser(u)
    setCreditsDraft(u.credits)
    setCreditDialogOpen(true)
  }

  const handleSaveCredits = async () => {
    if (!selectedUser) return
    setIsSavingCredits(true)
    try {
      await updateUserCredits(selectedUser.id, { credits: creditsDraft })
      setCreditDialogOpen(false)
      await refreshAll()
    } finally {
      setIsSavingCredits(false)
    }
  }

  const openPasswordDialog = (u: AdminUser) => {
    setPasswordSelectedUser(u)
    setPasswordDraft("")
    setPasswordDialogOpen(true)
  }

  const handleResetPassword = async () => {
    if (!passwordSelectedUser) return
    const trimmed = passwordDraft.trim()
    if (trimmed.length < 8) return

    setIsResettingPassword(true)
    try {
      await resetUserPassword(passwordSelectedUser.id, { password: trimmed })
      setPasswordDialogOpen(false)
      await refreshAll()
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleDeleteUser = async (u: AdminUser) => {
    const ok = window.confirm(`Delete user ${u.email}? This cannot be undone.`)
    if (!ok) return
    setIsLoadingUsers(true)
    try {
      await deleteUser(u.id)
      await refreshAll()
    } finally {
      setIsLoadingUsers(false)
    }
  }

  if (!user || !isAdmin) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-bold text-foreground mb-1">Admin</h1>
          <p className="text-muted text-sm">Access denied.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-1">
          <Shield className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Admin</h1>
        </div>
        <p className="text-muted text-sm">Manage users, credits, and view usage stats</p>
      </motion.div>

      <div className="flex items-center justify-between gap-3">
        <Card className="flex-1">
          <CardContent className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-accent" />
              <div className="space-y-0.5">
                <p className="text-sm text-muted">Admin snapshot</p>
                <p className="text-foreground font-semibold">{stats ? "Live stats loaded" : "Loading..."}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void refreshAll()} disabled={isLoadingStats || isLoadingUsers}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingStats ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[122px] rounded-xl border border-border bg-card animate-pulse" />)
        ) : (
          dashboardStats.map((stat, idx) => (
            <div key={stat.label}>
              <StatCard stat={{ ...stat, trend: undefined, icon: stat.icon }} index={idx} />
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Credits usage (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-[180px] rounded-xl border border-border bg-card animate-pulse" />
            ) : (
              <SimpleLineChart data={creditUsagePoints} ariaLabel="Credits usage" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New users (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-[180px] rounded-xl border border-border bg-card animate-pulse" />
            ) : (
              <SimpleLineChart data={newUsersPoints} ariaLabel="New users" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>User management</CardTitle>
            <p className="text-sm text-muted mt-1">Adjust credits and delete users</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-72">
              <Input
                value={query}
                onChange={(e) => {
                  setPage(1)
                  setQuery(e.target.value)
                }}
                placeholder="Search by email..."
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPage(1)
                void refreshAll()
              }}
              disabled={isLoadingUsers}
            >
              Search
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingUsers ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-muted">No users found.</div>
          ) : (
            <div className="space-y-0.5">
              {users.map((u) => (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-border last:border-b-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted">
                      Created {new Date(u.createdAt).toLocaleDateString()} • {u.generationCount} generations
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className="bg-accent/10 text-accent border-accent/20 gap-1">
                      <CreditCard className="h-3.5 w-3.5" />
                      {Math.floor(u.credits)} credits
                    </Badge>

                    <Button variant="outline" size="sm" className="gap-2" onClick={() => openCreditsDialog(u)}>
                      Edit credits
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => openPasswordDialog(u)}
                    >
                      <KeyRound className="h-4 w-4" />
                      Reset password
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      onClick={() => void handleDeleteUser(u)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-5">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  Prev
                </Button>

                <div className="text-sm text-muted">
                  Page <span className="text-foreground font-semibold">{page}</span> of{" "}
                  <span className="text-foreground font-semibold">{Math.max(1, Math.ceil(totalUsers / pageSize))}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= totalUsers}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user credits</DialogTitle>
            <DialogDescription>
              {selectedUser ? `User: ${selectedUser.email}` : "Select a user"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="credits">Credits</Label>
            <Input
              id="credits"
              type="number"
              min={0}
              value={creditsDraft}
              onChange={(e) => setCreditsDraft(Number(e.target.value))}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialogOpen(false)} disabled={isSavingCredits}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveCredits()} disabled={isSavingCredits}>
              {isSavingCredits ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset user password</DialogTitle>
            <DialogDescription>
              {passwordSelectedUser ? `User: ${passwordSelectedUser.email}` : "Select a user"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              placeholder="At least 8 characters"
              value={passwordDraft}
              onChange={(e) => setPasswordDraft(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)} disabled={isResettingPassword}>
              Cancel
            </Button>
            <Button onClick={() => void handleResetPassword()} disabled={isResettingPassword || passwordDraft.trim().length < 8}>
              {isResettingPassword ? "Resetting..." : "Reset password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
