import { Intent, IntentStatus } from '@/domain/entities/intent'

export interface InviteDTO {
  id: string
  intentId: string
  token: string
  expiresAt: Date
  status: string
  createdAt: Date
}

export interface IntentDTO {
  id: string
  fullName: string
  email: string
  phone?: string | null
  notes?: string | null
  status: IntentStatus
  createdAt: Date
  reviewedAt?: Date | null
  reviewedBy?: string | null
  invite?: InviteDTO | null
}

export class IntentMapper {
  static toDTO(intent: Intent): IntentDTO {
    return {
      id: intent.id,
      fullName: intent.fullName,
      email: intent.email,
      phone: intent.phone ?? null,
      notes: intent.notes ?? null,
      status: intent.status,
      createdAt: intent.createdAt,
      reviewedAt: intent.reviewedAt ?? null,
      reviewedBy: intent.reviewedBy ?? null,
      invite: intent.invite ? {
        id: intent.invite.id,
        intentId: intent.invite.intentId,
        token: intent.invite.token,
        expiresAt: intent.invite.expiresAt,
        status: intent.invite.status,
        createdAt: intent.invite.createdAt,
      } : null,
    }
  }
}
