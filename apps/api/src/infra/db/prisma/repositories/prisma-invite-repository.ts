import { PrismaClient } from '@prisma/client'
import {
  InviteRepository,
  CreateInviteData,
  UpdateInviteStatusData,
} from '@/application/ports/invite-repository'
import { Invite } from '@/domain/entities/invite'

export class PrismaInviteRepository implements InviteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateInviteData): Promise<Invite> {
    const invite = await this.prisma.invite.create({
      data: {
        intentId: data.intentId,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    })

    return invite as Invite
  }

  async findById(id: string): Promise<Invite | null> {
    const invite = await this.prisma.invite.findUnique({
      where: { id },
    })

    return invite as Invite | null
  }

  async findByToken(token: string): Promise<Invite | null> {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
    })

    return invite as Invite | null
  }

  async findByIntentId(intentId: string): Promise<Invite | null> {
    const invite = await this.prisma.invite.findUnique({
      where: { intentId },
    })

    return invite as Invite | null
  }

  async updateStatus(data: UpdateInviteStatusData): Promise<Invite> {
    await this.prisma.invite.update({
      where: { id: data.id },
      data: {
        status: data.status,
      },
    })

    // Fetch updated invite to ensure all fields are returned
    const invite = await this.prisma.invite.findUnique({
      where: { id: data.id },
    })

    if (!invite) {
      throw new Error('Invite not found after update')
    }

    return invite as Invite
  }
}
