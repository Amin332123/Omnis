import { describe, it, expect, vi, beforeEach } from "vitest"
import { NotFoundException } from "@nestjs/common"
import { PlansService } from "./plans.service.js"
import type { PrismaService } from "../prisma/prisma.service.js"

function createMockPrisma(): PrismaService {
  const plans: Record<string, unknown>[] = []
  return {
    plan: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockImplementation(({ data }) => {
        const plan = { id: "plan-" + Date.now(), ...data, createdAt: new Date(), updatedAt: new Date() }
        plans.push(plan)
        return Promise.resolve(plan)
      }),
      findMany: vi.fn().mockImplementation(({ where, orderBy, skip, take } = {}) => {
        let result = [...plans]
        if (where?.active === true) result = result.filter((p) => p.active === true)
        if (where?.active === false) result = result.filter((p) => p.active === false)
        if (orderBy) {
          result.sort((a, b) => {
            for (const [key, dir] of Object.entries(orderBy)) {
              const aVal = a[key as keyof typeof a] as number
              const bVal = b[key as keyof typeof b] as number
              if (aVal !== bVal) return dir === "asc" ? aVal - bVal : bVal - aVal
            }
            return 0
          })
        }
        return Promise.resolve(result)
      }),
      findUnique: vi.fn().mockImplementation(({ where: { id } }) => {
        const plan = plans.find((p) => (p as Record<string, unknown>).id === id)
        return Promise.resolve(plan ?? null)
      }),
      update: vi.fn().mockImplementation(({ where: { id }, data }) => {
        const idx = plans.findIndex((p) => (p as Record<string, unknown>).id === id)
        if (idx === -1) return Promise.reject(new NotFoundException("Plan not found"))
        plans[idx] = { ...plans[idx], ...data, updatedAt: new Date() }
        return Promise.resolve(plans[idx])
      }),
      delete: vi.fn().mockImplementation(({ where: { id } }) => {
        const idx = plans.findIndex((p) => (p as Record<string, unknown>).id === id)
        if (idx === -1) return Promise.reject(new NotFoundException("Plan not found"))
        plans.splice(idx, 1)
        return Promise.resolve({ id })
      }),
    },
  } as unknown as PrismaService
}

describe("PlansService", () => {
  let service: PlansService
  let prisma: PrismaService

  beforeEach(async () => {
    vi.clearAllMocks()
    prisma = createMockPrisma()
    service = new PlansService(prisma)
    // Run seeding on init
    vi.mocked(prisma.plan.count).mockResolvedValue(0)
    await service.onModuleInit()
  })

  it("should seed 3 default plans on init when empty", async () => {
    expect(vi.mocked(prisma.plan.count)).toHaveBeenCalled()
    expect(vi.mocked(prisma.plan.create)).toHaveBeenCalledTimes(3)
  })

  it("should not seed if plans already exist", async () => {
    vi.clearAllMocks()
    const prisma2 = createMockPrisma()
    vi.mocked(prisma2.plan.count).mockResolvedValue(5)
    const svc = new PlansService(prisma2)
    await svc.onModuleInit()
    expect(vi.mocked(prisma2.plan.create)).not.toHaveBeenCalled()
  })

  it("should findActive return only active plans", async () => {
    const active = (await service.findActive()) as Record<string, unknown>[]
    expect(active.every((p) => p.active === true)).toBe(true)
    expect(active.length).toBe(3)
  })

  it("should findActive use cache on subsequent calls", async () => {
    await service.findActive()
    await service.findActive()
    // findMany should only be called once (second call uses cache)
    expect(vi.mocked(prisma.plan.findMany)).toHaveBeenCalledTimes(1)
  })

  it("should findOne throw NotFoundException for non-existent plan", async () => {
    await expect(service.findOne("non-existent")).rejects.toThrow(NotFoundException)
  })

  it("should findOne return a plan by ID", async () => {
    const plans = (await service.findActive()) as Record<string, unknown>[]
    const found = await service.findOne(plans[0].id as string)
    expect(found.id).toBe(plans[0].id)
  })

  it("should create a new plan and clear cache", async () => {
    await service.findActive()
    expect(vi.mocked(prisma.plan.findMany)).toHaveBeenCalledTimes(1)

    const created = await service.create({
      name: "Test Plan",
      credits: 500,
      price: 49,
      active: true,
    })
    expect(created.name).toBe("Test Plan")
    expect(created.credits).toBe(500)

    // Cache should be cleared by create, so findMany gets called again
    await service.findActive()
    expect(vi.mocked(prisma.plan.findMany)).toHaveBeenCalledTimes(2)
  })

  it("should update a plan", async () => {
    const plans = (await service.findActive()) as Record<string, unknown>[]
    const updated = await service.update(plans[0].id as string, { name: "Updated Plan", price: 39 })
    expect(updated.name).toBe("Updated Plan")
    expect(updated.price).toBe(39)
  })

  it("should delete a plan", async () => {
    const plans = (await service.findActive()) as Record<string, unknown>[]
    const result = await service.remove(plans[0].id as string)
    expect(result).toEqual({ success: true })

    const remaining = (await service.findActive()) as Record<string, unknown>[]
    expect(remaining.length).toBe(2)
  })

  it("should seed plans with paddlePriceId matching the product map", async () => {
    const plans = (await service.findAll()) as Record<string, unknown>[]
    const starter = plans.find((p) => p.name === "Starter Pack") as Record<string, unknown>
    expect(starter.paddlePriceId).toBe("pri_01kty77r9kb063d99s3pdkdkyc")

    const pro = plans.find((p) => p.name === "Pro Pack") as Record<string, unknown>
    expect(pro.paddlePriceId).toBe("pri_01kty7krpry1p3m9sft9styf0c")

    const proMax = plans.find((p) => p.name === "Pro Max Pack") as Record<string, unknown>
    expect(proMax.paddlePriceId).toBe("pri_01kty7mw8jtfbx5e2dyqbxarrc")
  })
})
