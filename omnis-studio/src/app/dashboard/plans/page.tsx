"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Package, Plus, Pencil, Trash2, RefreshCw, X, Sparkles, ArrowUp, ArrowDown } from "lucide-react"

import { useAuth } from "@/context/auth-context"
import { getAllPlans, createPlan, updatePlan, deletePlan, type PlanResponse } from "@/lib/plans-api"
import { getApiErrorMessage } from "@/lib/api"
import { showSuccessToast } from "@/lib/error-handler"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Swal from "sweetalert2"

const emptyForm = { name: "", credits: 0, price: 0, features: [""], popular: false, active: true }

export default function PlansPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [plans, setPlans] = useState<PlanResponse[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanResponse | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [isSaving, setIsSaving] = useState(false)

  const isAdmin = !!user?.isAdmin

  useEffect(() => {
    if (isLoading) return
    if (!user) return
    if (!user.isAdmin) router.replace("/dashboard")
  }, [isLoading, user, router])

  const loadPlans = async () => {
    setIsLoadingPlans(true)
    try {
      const data = await getAllPlans()
      setPlans(data)
    } finally {
      setIsLoadingPlans(false)
    }
  }

  useEffect(() => {
    if (!user?.isAdmin) return
    void loadPlans()
  }, [user?.isAdmin])

  const openCreate = () => {
    setEditingPlan(null)
    setForm({ ...emptyForm })
    setDialogOpen(true)
  }

  const openEdit = (plan: PlanResponse) => {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      credits: plan.credits,
      price: plan.price,
      features: plan.features.length ? [...plan.features] : [""],
      popular: plan.popular,
      active: plan.active,
    })
    setDialogOpen(true)
  }

  const addFeature = () => {
    setForm((f) => ({ ...f, features: [...f.features, ""] }))
  }

  const removeFeature = (i: number) => {
    setForm((f) => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))
  }

  const setFeature = (i: number, value: string) => {
    setForm((f) => {
      const next = [...f.features]
      next[i] = value
      return { ...f, features: next }
    })
  }

  const handleSave = async () => {
    if (!form.name.trim() || form.credits < 1 || form.price < 0) return
    const features = form.features.filter((f) => f.trim().length > 0)
    setIsSaving(true)
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, { ...form, features })
        showSuccessToast("Plan updated")
      } else {
        await createPlan({ ...form, features })
        showSuccessToast("Plan created")
      }
      setDialogOpen(false)
      await loadPlans()
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to save plan.")
      const isDark = document.documentElement.classList.contains("dark")
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        background: isDark ? "#18181B" : "#ffffff",
        color: isDark ? "#FAFAFA" : "#111827",
        confirmButtonColor: "#6366f1",
        customClass: { popup: ["!rounded-xl !shadow-2xl !border", isDark ? "!border-[#27272A]" : "!border-[#E5E7EB]"].join(" ") },
      })
    } finally {
      setIsSaving(false)
    }
  }

  const movePlan = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= plans.length) return

    const current = plans[index]
    const target = plans[targetIndex]

    try {
      await Promise.all([
        updatePlan(current.id, { sortOrder: target.sortOrder }),
        updatePlan(target.id, { sortOrder: current.sortOrder }),
      ])
      showSuccessToast(`Plan moved ${direction}`)
      await loadPlans()
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to reorder plan.")
      const isDark = document.documentElement.classList.contains("dark")
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        background: isDark ? "#18181B" : "#ffffff",
        color: isDark ? "#FAFAFA" : "#111827",
        confirmButtonColor: "#6366f1",
      })
    }
  }

  const moveFeature = (i: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? i - 1 : i + 1
    if (targetIndex < 0 || targetIndex >= form.features.length) return
    setForm((f) => {
      const next = [...f.features]
      ;[next[i], next[targetIndex]] = [next[targetIndex], next[i]]
      return { ...f, features: next }
    })
  }

  const handleDelete = async (plan: PlanResponse) => {
    const isDark = document.documentElement.classList.contains("dark")
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete plan?",
      text: `Are you sure you want to delete "${plan.name}"?`,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      background: isDark ? "#18181B" : "#ffffff",
      color: isDark ? "#FAFAFA" : "#111827",
      iconColor: "#ef4444",
      confirmButtonColor: "#ef4444",
      customClass: { popup: ["!rounded-xl !shadow-2xl !border", isDark ? "!border-[#27272A]" : "!border-[#E5E7EB]"].join(" ") },
    })
    if (!result.isConfirmed) return
    try {
      await deletePlan(plan.id)
      showSuccessToast("Plan deleted")
      await loadPlans()
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to delete plan.")
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        background: isDark ? "#18181B" : "#ffffff",
        color: isDark ? "#FAFAFA" : "#111827",
        confirmButtonColor: "#6366f1",
      })
    }
  }

  if (!user || !isAdmin) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-bold text-foreground mb-1">Plans</h1>
          <p className="text-muted text-sm">Access denied.</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-1">
          <Package className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">Credit Plans</h1>
        </div>
        <p className="text-muted text-sm">Manage credit packs shown on the billing page</p>
      </motion.div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle>All Plans</CardTitle>
            <p className="text-sm text-muted mt-1">{plans.length} plan{plans.length !== 1 ? "s" : ""} configured</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => void loadPlans()} disabled={isLoadingPlans}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" className="gap-2" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Plan
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoadingPlans ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg border border-border bg-card animate-pulse" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="py-10 text-center text-muted">
              <Package className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="mb-4">No plans created yet.</p>
              <Button size="sm" className="gap-2" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create your first plan
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                        {plan.popular && <Badge variant="default" className="text-[10px] px-1.5 py-0">Popular</Badge>}
                        <Badge variant={plan.active ? "success" : "secondary"} className="text-[10px] px-1.5 py-0">
                          {plan.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted">
                        <span className="font-medium text-foreground">{plan.credits}</span> credits — $
                        <span className="font-medium text-foreground">{plan.price}</span>
                      </p>
                      {plan.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {plan.features.map((f, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-[11px] text-muted bg-muted/30 rounded-full px-2 py-0.5">
                              <Sparkles className="h-2.5 w-2.5 text-accent" />
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex flex-col gap-0.5 mr-1">
                        <button
                          className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted/50 text-muted disabled:opacity-20"
                          onClick={() => void movePlan(plans.indexOf(plan), "up")}
                          disabled={plans.indexOf(plan) === 0}
                          title="Move up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted/50 text-muted disabled:opacity-20"
                          onClick={() => void movePlan(plans.indexOf(plan), "down")}
                          disabled={plans.indexOf(plan) === plans.length - 1}
                          title="Move down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(plan)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => void handleDelete(plan)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? `Editing "${editingPlan.name}"` : "Add a new credit pack for users to purchase"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input id="plan-name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Starter Pack" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-credits">Credits</Label>
                <Input id="plan-credits" type="number" min={1} value={form.credits} onChange={(e) => setForm((p) => ({ ...p, credits: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-price">Price ($)</Label>
                <Input id="plan-price" type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Features</Label>
                <Button type="button" variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={addFeature}>
                  <Plus className="h-3 w-3" />
                  Add feature
                </Button>
              </div>
              <div className="space-y-2">
                {form.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="flex flex-col gap-0.5">
                      <button
                        className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted/50 text-muted disabled:opacity-20"
                        onClick={() => moveFeature(i, "up")}
                        disabled={i === 0}
                        title="Move up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted/50 text-muted disabled:opacity-20"
                        onClick={() => moveFeature(i, "down")}
                        disabled={i === form.features.length - 1}
                        title="Move down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    <Input
                      value={feature}
                      onChange={(e) => setFeature(i, e.target.value)}
                      placeholder="e.g. Credits never expire"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-muted hover:text-error"
                      onClick={() => removeFeature(i)}
                      disabled={form.features.length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.popular} onChange={(e) => setForm((p) => ({ ...p, popular: e.target.checked }))} className="rounded border-border" />
                Popular badge
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} className="rounded border-border" />
                Active
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving || !form.name.trim() || form.credits < 1 || form.price < 0}>
              {isSaving ? "Saving..." : editingPlan ? "Save Changes" : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
