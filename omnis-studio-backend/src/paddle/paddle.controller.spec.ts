import { describe, it, expect, vi, beforeEach } from "vitest"
import { BadRequestException } from "@nestjs/common"
import type { Request } from "express"
import { PaddleController } from "./paddle.controller.js"
import { PaddleService } from "./paddle.service.js"
import { PrismaService } from "../prisma/prisma.service.js"
import { EventName } from "@paddle/paddle-node-sdk"

function createMockPaddleService() {
  return {
    unmarshal: vi.fn(),
    processTransactionCompleted: vi.fn(),
    processTransactionCanceled: vi.fn(),
  } as unknown as PaddleService
}

function createMockPrisma() {
  return {
    paddleWebhookEvent: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    transaction: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  } as unknown as PrismaService
}

function createRequest(rawBody: string | null, signature: string | null): Request {
  return {
    rawBody: rawBody ? Buffer.from(rawBody) : null,
    headers: {
      "paddle-signature": signature,
    },
  } as unknown as Request
}

describe("PaddleController", () => {
  let controller: PaddleController
  let service: PaddleService
  let prisma: PrismaService

  beforeEach(() => {
    vi.clearAllMocks()
    service = createMockPaddleService()
    prisma = createMockPrisma()
    controller = new PaddleController(service, prisma)
  })

  it("should throw BadRequestException if rawBody is missing", async () => {
    const req = createRequest(null, "sig123")
    await expect(
      controller.handleWebhook(req, "sig123"),
    ).rejects.toThrow(BadRequestException)
  })

  it("should throw BadRequestException if signature is missing", async () => {
    const req = createRequest('{"event_type":"test"}', null)
    await expect(
      controller.handleWebhook(req, ""),
    ).rejects.toThrow(BadRequestException)
  })

  it("should throw BadRequestException on invalid webhook signature", async () => {
    vi.mocked(service.unmarshal).mockRejectedValue(new Error("Invalid signature"))

    const req = createRequest('{"event_type":"test"}', "bad-sig")
    await expect(
      controller.handleWebhook(req, "bad-sig"),
    ).rejects.toThrow(BadRequestException)
  })

  it("should process transaction.completed event", async () => {
    vi.mocked(service.unmarshal).mockResolvedValue({
      eventType: EventName.TransactionCompleted,
      eventId: "evt-1",
      data: {},
    } as never)

    const req = createRequest('{"event_type":"transaction.completed"}', "valid-sig")
    const result = await controller.handleWebhook(req, "valid-sig")

    expect(service.processTransactionCompleted).toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })

  it("should process transaction.paid event", async () => {
    vi.mocked(service.unmarshal).mockResolvedValue({
      eventType: EventName.TransactionPaid,
      eventId: "evt-2",
      data: {},
    } as never)

    const req = createRequest('{"event_type":"transaction.paid"}', "valid-sig")
    const result = await controller.handleWebhook(req, "valid-sig")

    expect(service.processTransactionCompleted).toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })

  it("should process transaction.canceled event", async () => {
    vi.mocked(service.unmarshal).mockResolvedValue({
      eventType: EventName.TransactionCanceled,
      eventId: "evt-3",
      data: {},
    } as never)

    const req = createRequest('{"event_type":"transaction.canceled"}', "valid-sig")
    const result = await controller.handleWebhook(req, "valid-sig")

    expect(service.processTransactionCanceled).toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })

  it("should return success for unhandled event types", async () => {
    vi.mocked(service.unmarshal).mockResolvedValue({
      eventType: "subscription.created" as EventName,
      eventId: "evt-4",
      data: {},
    } as never)

    const req = createRequest('{"event_type":"subscription.created"}', "valid-sig")
    const result = await controller.handleWebhook(req, "valid-sig")

    expect(service.processTransactionCompleted).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })
})
