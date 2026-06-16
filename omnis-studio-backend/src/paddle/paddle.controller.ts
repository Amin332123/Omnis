import { Controller, Post, HttpCode, HttpStatus, Headers, Req, BadRequestException, Logger } from "@nestjs/common"
import { ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger"
import type { Request } from "express"
import { PaddleService } from "./paddle.service.js"
import { EventName, TransactionCompletedEvent, TransactionPaidEvent, TransactionCanceledEvent } from "@paddle/paddle-node-sdk"

@ApiTags("paddle")
@Controller("webhooks")
export class PaddleController {
  private readonly logger = new Logger(PaddleController.name)

  constructor(private readonly paddleService: PaddleService) {}

  @Post("paddle")
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: Request,
    @Headers("paddle-signature") signature: string,
  ): Promise<{ success: boolean }> {
    const rawBody = (req as unknown as { rawBody: Buffer }).rawBody

    if (!rawBody || !signature) {
      throw new BadRequestException("Missing request body or Paddle-Signature header")
    }

    const rawBodyString = rawBody.toString("utf8")

    let event: import("@paddle/paddle-node-sdk").EventEntity
    try {
      event = await this.paddleService.unmarshal(rawBodyString, signature)
    } catch (error) {
      this.logger.warn("Invalid webhook signature", error)
      throw new BadRequestException("Invalid webhook signature")
    }

    if (event.eventType === EventName.TransactionCompleted || event.eventType === EventName.TransactionPaid) {
      await this.paddleService.processTransactionCompleted(event as TransactionCompletedEvent)
    } else if (event.eventType === EventName.TransactionCanceled) {
      await this.paddleService.processTransactionCanceled(event as TransactionCanceledEvent)
    } else {
      this.logger.log(`Unhandled Paddle event type: ${event.eventType}`)
    }

    return { success: true }
  }
}
