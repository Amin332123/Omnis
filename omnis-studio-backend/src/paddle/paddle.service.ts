import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "../prisma/prisma.service.js"
import { PADDLE_PRODUCT_MAP } from "./paddle.config.js"
import {
  Paddle,
  Environment,
  TransactionCompletedEvent,
  TransactionNotification,
} from "@paddle/paddle-node-sdk"

type PlanInfo = { name: string; credits: number; price: number }

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

  private async findPlanByPriceId(priceId: string): Promise<PlanInfo | null> {
    const dbPlan = await this.prisma.plan.findFirst({
      where: { paddlePriceId: priceId, active: true },
      select: { name: true, credits: true, price: true },
    })
    if (dbPlan) {
      return { name: dbPlan.name, credits: dbPlan.credits, price: dbPlan.price }
    }
    return PADDLE_PRODUCT_MAP[priceId] ?? null
  }

  private async markEventProcessed(evtId: string, eventType: string): Promise<boolean> {
    const existing = await this.prisma.paddleWebhookEvent.findUnique({
      where: { evtId },
    })
    if (existing) {
      this.logger.log(`Webhook event ${evtId} already processed, skipping`)
      return false
    }
    await this.prisma.paddleWebhookEvent.create({
      data: { evtId, eventType },
    })
    return true
  }

  async processTransactionCompleted(event: TransactionCompletedEvent): Promise<void> {
    const eventId = event.eventId
    const eventType = event.eventType
    const transaction: TransactionNotification = event.data
    const transactionId = transaction.id

    if (!(await this.markEventProcessed(eventId, eventType))) return

    const customData = transaction.customData
    const userId = customData?.user_id as string | undefined
    const items = transaction.items
    const currency = transaction.currencyCode

    if (!transactionId || !userId) {
      this.logger.warn(`Transaction ${transactionId} missing user_id in custom_data`)
      return
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      this.logger.warn(`User ${userId} not found for transaction ${transactionId}`)
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
        const product = await this.findPlanByPriceId(price.id)
        if (product) {
          creditsPurchased += product.credits * item.quantity
        }
      }
    }

    if (creditsPurchased <= 0) {
      this.logger.warn(`No valid Paddle product found for transaction ${transactionId}`)
      return
    }

    const creditsBefore = user.credits
    const creditsAfter = creditsBefore + creditsPurchased

    await this.prisma.$transaction(async (tx) => {
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

  async processTransactionCanceled(event: TransactionPaidEventType): Promise<void> {
    const eventId = event.eventId
    const eventType = event.eventType
    const notification = event.data
    const transactionId = notification.id

    if (!(await this.markEventProcessed(eventId, eventType))) return

    const existingTxn = await this.prisma.transaction.findUnique({
      where: { paddleTransactionId: transactionId },
    })

    if (existingTxn && existingTxn.status !== "canceled") {
      await this.prisma.transaction.update({
        where: { id: existingTxn.id },
        data: { status: "canceled" },
      })
      this.logger.log(`Transaction ${transactionId} marked as canceled`)
    }
  }

  async processTransactionRevised(event: TransactionRevisedEventType): Promise<void> {
    const eventId = event.eventId
    const eventType = event.eventType
    const notification = event.data
    const transactionId = notification.id

    if (!(await this.markEventProcessed(eventId, eventType))) return

    const existingTxn = await this.prisma.transaction.findUnique({
      where: { paddleTransactionId: transactionId },
    })

    if (!existingTxn) {
      this.logger.warn(`No existing transaction found for revised transaction ${transactionId}`)
      return
    }

    const txnStatus = notification.status as string
    const isRefunded = txnStatus === "refunded" || txnStatus === "partially_refunded"
    if (!isRefunded || existingTxn.status === "refunded") return

    const userId = existingTxn.userId
    const creditsPurchased = existingTxn.creditsPurchased

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      this.logger.warn(`User ${userId} not found for refund of transaction ${transactionId}`)
      return
    }

    const creditsBefore = user.credits
    const creditsAfter = Math.max(0, creditsBefore - creditsPurchased)

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { credits: creditsAfter },
      })
      await tx.transaction.update({
        where: { id: existingTxn.id },
        data: { status: "refunded" },
      })
    })

    this.logger.log(
      `Refunded ${creditsPurchased} credits from user ${userId} (${creditsBefore} → ${creditsAfter}) for transaction ${transactionId}`,
    )
  }
}

type TransactionPaidEventType = {
  eventId: string
  eventType: string
  data: TransactionNotification
}

type TransactionRevisedEventType = {
  eventId: string
  eventType: string
  data: TransactionNotification
}
