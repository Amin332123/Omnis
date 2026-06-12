import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "../prisma/prisma.service.js"
import { PADDLE_PRODUCT_MAP } from "./paddle.config.js"
import {
  Paddle,
  Environment,
  TransactionCompletedEvent,
  TransactionNotification,
  TransactionItemNotification,
} from "@paddle/paddle-node-sdk"

@Injectable()
export class PaddleService {
  private readonly logger = new Logger(PaddleService.name)
  private paddle: Paddle | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private getClient(): Paddle {
    if (!this.paddle) {
      const apiKey = this.configService.getOrThrow<string>("PADDLE_API_KEY")
      const environment = this.configService.get<string>("PADDLE_ENVIRONMENT") ?? "sandbox"
      this.paddle = new Paddle(apiKey, {
        environment: environment === "production" ? Environment.production : Environment.sandbox,
      })
    }
    return this.paddle
  }

  async unmarshal(rawBody: string, signature: string) {
    const secretKey = this.configService.getOrThrow<string>("PADDLE_WEBHOOK_SECRET")
    return this.getClient().webhooks.unmarshal(rawBody, secretKey, signature)
  }

  async processTransactionCompleted(event: TransactionCompletedEvent): Promise<void> {
    const eventId = event.eventId
    const eventType = event.eventType

    const existing = await this.prisma.paddleWebhookEvent.findUnique({
      where: { evtId: eventId },
    })
    if (existing) {
      this.logger.log(`Webhook event ${eventId} already processed, skipping`)
      return
    }

    const transaction: TransactionNotification = event.data
    const transactionId = transaction.id
    const customData = transaction.customData
    const userId = customData?.user_id as string | undefined
    const items = transaction.items
    const currency = transaction.currencyCode

    if (!transactionId || !userId) {
      this.logger.warn(`Transaction missing user_id in custom_data`)
      await this.prisma.paddleWebhookEvent.create({
        data: { evtId: eventId, eventType },
      })
      return
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      this.logger.warn(`User ${userId} not found for transaction ${transactionId}`)
      await this.prisma.paddleWebhookEvent.create({
        data: { evtId: eventId, eventType },
      })
      return
    }

    let creditsPurchased = 0
    let amount = 0

    const totals = transaction.details?.totals
    if (totals) {
      amount = Number(totals.total) / 100
    }

    for (const item of items) {
      const price = item.price
      if (price) {
        const product = PADDLE_PRODUCT_MAP[price.id]
        if (product) {
          creditsPurchased += product.credits * item.quantity
        }
      }
    }

    if (creditsPurchased <= 0) {
      this.logger.warn(`No valid Paddle product found for transaction ${transactionId}`)
      await this.prisma.paddleWebhookEvent.create({
        data: { evtId: eventId, eventType },
      })
      return
    }

    const creditsBefore = user.credits
    const creditsAfter = creditsBefore + creditsPurchased

    await this.prisma.$transaction(async (tx) => {
      await tx.paddleWebhookEvent.create({
        data: { evtId: eventId, eventType },
      })

      await tx.user.update({
        where: { id: userId },
        data: { credits: creditsAfter },
      })

      await tx.transaction.create({
        data: {
          userId,
          paddleTransactionId: transactionId,
          amount,
          currency,
          creditsPurchased,
          creditsBefore,
          creditsAfter,
          status: "completed",
          details: event as never,
        },
      })
    })

    this.logger.log(
      `Credited ${creditsPurchased} credits to user ${userId} (${creditsBefore} → ${creditsAfter}) for transaction ${transactionId}`,
    )
  }
}
