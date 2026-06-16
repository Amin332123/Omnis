import { describe, it, expect, vi, beforeEach } from "vitest"
import { ConfigService } from "@nestjs/config"
import { PaddleService } from "./paddle.service.js"
import { PADDLE_PRODUCT_MAP } from "./paddle.config.js"
import type { PrismaService } from "../prisma/prisma.service.js"
import type { TransactionNotification } from "@paddle/paddle-node-sdk"

function createMockPrisma(): { prisma: PrismaService; mockTx: Record<string, { update?: unknown; create?: unknown; findUnique?: unknown }> } {
  const mockTx = {
    user: { update: vi.fn().mockResolvedValue({}) },
    transaction: { create: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}), findUnique: vi.fn().mockResolvedValue(null) },
    paddleWebhookEvent: { create: vi.fn().mockResolvedValue({}), findUnique: vi.fn().mockResolvedValue(null) },
  }
  const prisma = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    paddleWebhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    plan: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn((arg: unknown) => {
      if (typeof arg === "function") return arg(mockTx)
      return Promise.resolve([])
    }),
  } as unknown as PrismaService
  return { prisma, mockTx }
}

function createMockConfig(): ConfigService {
  return {
    getOrThrow: vi.fn((key: string) => {
      const map: Record<string, string> = {
        PADDLE_API_KEY: "test-api-key",
        PADDLE_WEBHOOK_SECRET: "test-webhook-secret",
      }
      return map[key] ?? ""
    }),
    get: vi.fn((key: string) => {
      const map: Record<string, string> = {
        PADDLE_ENVIRONMENT: "sandbox",
      }
      return map[key]
    }),
  } as unknown as ConfigService
}

function createTransactionEvent(overrides: Partial<{
  eventId: string
  transactionId: string
  userId: string
  priceId: string
  quantity: number
  currencyCode: string
  total: string
  credits: number
  status: string
}> = {}) {
  const {
    eventId = "evt_01j8x2d0k1abcdef1234567890",
    transactionId = "txn_01j8x2d0k1abcdef1234567890",
    userId = "user-123",
    priceId = "pri_01kty77r9kb063d99s3pdkdkyc",
    quantity = 1,
    currencyCode = "USD",
    total = "2900",
    credits = 300,
    status = "completed",
  } = overrides

  return {
    eventId,
    eventType: "transaction.completed",
    data: {
      id: transactionId,
      customData: { user_id: userId },
      currencyCode,
      items: [
        {
          price: {
            id: priceId,
          },
          quantity,
        },
      ],
      details: {
        totals: {
          total,
        },
      },
      status,
    } as unknown as TransactionNotification,
  }
}

describe("PaddleService", () => {
  let service: PaddleService
  let prisma: PrismaService
  let config: ConfigService
  let mockTx: Record<string, { update?: unknown; create?: unknown; findUnique?: unknown }>

  beforeEach(() => {
    vi.clearAllMocks()
    const ctx = createMockPrisma()
    prisma = ctx.prisma
    mockTx = ctx.mockTx
    config = createMockConfig()
    service = new PaddleService(config, prisma)
  })

  describe("processTransactionCompleted", () => {
    it("should skip if event already processed (idempotency)", async () => {
      vi.mocked(prisma.paddleWebhookEvent.findUnique).mockResolvedValue({
        evtId: "evt-123",
        eventType: "transaction.completed",
        processedAt: new Date(),
      })

      const event = createTransactionEvent()
      await service.processTransactionCompleted(event as never)

      expect(prisma.paddleWebhookEvent.findUnique).toHaveBeenCalledWith({
        where: { evtId: event.eventId },
      })
    })

    it("should skip if transaction is missing user_id", async () => {
      vi.mocked(prisma.paddleWebhookEvent.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.paddleWebhookEvent.create).mockResolvedValue({} as never)

      const event = createTransactionEvent({ userId: "" })
      ;(event.data as unknown as Record<string, unknown>).customData = undefined

      await service.processTransactionCompleted(event as never)

      expect(prisma.paddleWebhookEvent.create).toHaveBeenCalledTimes(1)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should skip if user is not found", async () => {
      vi.mocked(prisma.paddleWebhookEvent.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.paddleWebhookEvent.create).mockResolvedValue({} as never)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const event = createTransactionEvent()
      await service.processTransactionCompleted(event as never)

      expect(prisma.paddleWebhookEvent.create).toHaveBeenCalledTimes(1)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should skip if no valid product found for price ID", async () => {
      vi.mocked(prisma.paddleWebhookEvent.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.paddleWebhookEvent.create).mockResolvedValue({} as never)
      vi.mocked(prisma.plan.findFirst).mockResolvedValue(null)

      const event = createTransactionEvent({ priceId: "pri_unknown" })
      await service.processTransactionCompleted(event as never)

      expect(prisma.paddleWebhookEvent.create).toHaveBeenCalledTimes(1)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it("should credit user via hardcoded product map when DB has no match", async () => {
      vi.mocked(prisma.paddleWebhookEvent.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
        credits: 50,
      } as never)
      vi.mocked(prisma.plan.findFirst).mockResolvedValue(null)

      const event = createTransactionEvent()
      await service.processTransactionCompleted(event as never)

      expect(prisma.$transaction).toHaveBeenCalled()
      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { credits: 350 },
      })
      expect(mockTx.transaction.create).toHaveBeenCalled()
    })

    it("should look up plan from DB first", async () => {
      vi.mocked(prisma.paddleWebhookEvent.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
        credits: 100,
      } as never)
      vi.mocked(prisma.plan.findFirst).mockResolvedValue({
        name: "Custom Plan",
        credits: 500,
        price: 49,
      } as never)

      const event = createTransactionEvent()
      await service.processTransactionCompleted(event as never)

      expect(prisma.plan.findFirst).toHaveBeenCalledWith({
        where: { paddlePriceId: "pri_01kty77r9kb063d99s3pdkdkyc", active: true },
        select: { name: true, credits: true, price: true },
      })

      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { credits: 600 },
      })
      expect(mockTx.transaction.create).toHaveBeenCalled()
    })

    it("should handle multiple items in a single transaction", async () => {
      vi.mocked(prisma.paddleWebhookEvent.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
        credits: 0,
      } as never)
      vi.mocked(prisma.plan.findFirst).mockResolvedValue(null)

      const event = createTransactionEvent()
      ;(event.data as unknown as Record<string, unknown>).items = [
        {
          price: { id: "pri_01kty77r9kb063d99s3pdkdkyc" },
          quantity: 2,
        },
        {
          price: { id: "pri_01kty7krpry1p3m9sft9styf0c" },
          quantity: 1,
        },
      ]

      await service.processTransactionCompleted(event as never)

      expect(mockTx.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { credits: 1600 },
      })
    })

    it("should parse amount from totals", async () => {
      vi.mocked(prisma.paddleWebhookEvent.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user-123",
        credits: 0,
      } as never)
      vi.mocked(prisma.plan.findFirst).mockResolvedValue(null)

      const event = createTransactionEvent({ total: "7900" })
      await service.processTransactionCompleted(event as never)

      expect(mockTx.transaction.create).toHaveBeenCalled()
    })
  })

  describe("processTransactionCanceled", () => {
    it("should mark existing transaction as canceled", async () => {
      vi.mocked(prisma.paddleWebhookEvent.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.paddleWebhookEvent.create).mockResolvedValue({} as never)
      vi.mocked(prisma.transaction.findUnique).mockResolvedValue({
        id: "txn-db-1",
        status: "completed",
      } as never)
      vi.mocked(prisma.transaction.update).mockResolvedValue({} as never)

      const event = createTransactionEvent({
        eventId: "evt_cancel_1",
        transactionId: "txn_cancel_1",
      })

      await service.processTransactionCanceled({
        eventId: event.eventId,
        eventType: "transaction.canceled",
        data: event.data,
      })

      expect(prisma.transaction.update).toHaveBeenCalledWith({
        where: { id: "txn-db-1" },
        data: { status: "canceled" },
      })
    })
  })

  describe("PADDLE_PRODUCT_MAP", () => {
    it("should have consistent mappings", () => {
      const prices = Object.entries(PADDLE_PRODUCT_MAP)
      expect(prices.length).toBe(3)
      expect(PADDLE_PRODUCT_MAP["pri_01kty77r9kb063d99s3pdkdkyc"]).toEqual({
        name: "Starter Pack",
        credits: 300,
        price: 29,
      })
      expect(PADDLE_PRODUCT_MAP["pri_01kty7krpry1p3m9sft9styf0c"]).toEqual({
        name: "Pro Pack",
        credits: 1000,
        price: 79,
      })
      expect(PADDLE_PRODUCT_MAP["pri_01kty7mw8jtfbx5e2dyqbxarrc"]).toEqual({
        name: "Pro Max Pack",
        credits: 2000,
        price: 149,
      })
    })
  })
})
