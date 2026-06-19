import { Controller, Get, Post, HttpCode, HttpStatus, Headers, Req, BadRequestException, Logger } from "@nestjs/common"
import { ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger"
import type { Request } from "express"
import { PaddleService } from "./paddle.service.js"
import { PrismaService } from "../prisma/prisma.service.js"
import { EventName, TransactionCompletedEvent, TransactionCanceledEvent, TransactionRevisedEvent } from "@paddle/paddle-node-sdk"

@ApiTags("paddle")
@Controller("webhooks")
export class PaddleController {
  private readonly logger = new Logger(PaddleController.name)

  constructor(
    private readonly paddleService: PaddleService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("paddle")
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  healthCheck(): { status: string; message: string } {
    return { status: "ok", message: "Paddle webhook endpoint is reachable" }
  }

  @Post("paddle")
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: Request,
    @Headers("paddle-signature") signature: string,
  ): Promise<{ success: boolean }> {
    const rawBody = (req as unknown as { rawBody: Buffer }).rawBody

    this.logger.log(`Incoming webhook: rawBody=${!!rawBody}, signature=${!!signature}`)

    if (!rawBody || !signature) {
      this.logger.warn(`Missing rawBody=${!!rawBody} signature=${!!signature}`)
      throw new BadRequestException("Missing request body or Paddle-Signature header")
    }

    const rawBodyString = rawBody.toString("utf8")

    let event: import("@paddle/paddle-node-sdk").EventEntity
    try {
      event = await this.paddleService.unmarshal(rawBodyString, signature)
    } catch (error) {
      this.logger.warn(
        `Invalid webhook signature. Error: ${error instanceof Error ? error.message : error}`,
      )
      throw new BadRequestException("Invalid webhook signature")
    }

    this.logger.log(`Processing Paddle event: ${event.eventType} (id: ${event.eventId})`)

    try {
      if (
        event.eventType === EventName.TransactionCompleted
        || event.eventType === EventName.TransactionPaid
        || event.eventType === EventName.TransactionBilled
      ) {
        await this.paddleService.processTransactionCompleted(event as TransactionCompletedEvent)
      } else if (event.eventType === EventName.TransactionCanceled) {
        await this.paddleService.processTransactionCanceled(event as TransactionCanceledEvent)
      } else if (event.eventType === EventName.TransactionRevised) {
        await this.paddleService.processTransactionRevised(event as TransactionRevisedEvent)
      } else {
        this.logger.log(`Unhandled Paddle event type: ${event.eventType}`)
      }
    } catch (error) {
      this.logger.error(
        `Error processing event ${event.eventType}: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      )
      // Return 200 to Paddle anyway so it doesn't keep retrying a failing event
    }

    this.logger.log(`✓ Webhook processed: ${event.eventType}`)
    return { success: true }
  }

  @Get("paddle/events")
  @ApiExcludeEndpoint()
  async recentEvents(): Promise<unknown[]> {
    return this.prisma.paddleWebhookEvent.findMany({
      orderBy: { processedAt: "desc" },
      take: 10,
    })
  }

  @Get("paddle/transactions")
  @ApiExcludeEndpoint()
  async recentTransactions(): Promise<unknown[]> {
    return this.prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    })
  }
}
