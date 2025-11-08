import { PrismaClient } from '@prisma/client'
import {
  IntentRepository,
  CreateIntentData,
  UpdateIntentStatusData,
  ListIntentsParams,
} from '@/application/ports/intent-repository'
import { Intent } from '@/domain/entities/intent'

export class PrismaIntentRepository implements IntentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateIntentData): Promise<Intent> {
    const intent = await this.prisma.intent.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        notes: data.notes ?? null,
      },
    })

    return intent as Intent
  }

  async findById(id: string): Promise<Intent | null> {
    const intent = await this.prisma.intent.findUnique({
      where: { id },
    })

    return intent as Intent | null
  }

  async findByEmail(email: string): Promise<Intent | null> {
    const intent = await this.prisma.intent.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    })

    return intent as Intent | null
  }

  async list(params: ListIntentsParams): Promise<{ items: Intent[]; total: number }> {
    const { status, page = 1, pageSize = 20 } = params
    const skip = (page - 1) * pageSize

    const where = status ? { status } : {}

    const [items, total] = await Promise.all([
      this.prisma.intent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          invite: true,
        },
      }),
      this.prisma.intent.count({ where }),
    ])

    return { items: items as Intent[], total }
  }

  async updateStatus(data: UpdateIntentStatusData): Promise<Intent> {
    await this.prisma.intent.update({
      where: { id: data.id },
      data: {
        status: data.status,
        reviewedAt: new Date(),
        reviewedBy: data.reviewedBy,
      },
    })

    // Fetch updated intent to ensure all fields are returned
    const intent = await this.prisma.intent.findUnique({
      where: { id: data.id },
    })

    if (!intent) {
      throw new Error('Intent not found after update')
    }

    return intent as Intent
  }
}
// Performance optimization
