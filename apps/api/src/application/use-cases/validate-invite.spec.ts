import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ValidateInviteUseCase } from './validate-invite'
import type { InviteRepository } from '@/application/ports/invite-repository'
import type { Invite } from '@/domain/entities/invite'

describe('ValidateInviteUseCase', () => {
  let sut: ValidateInviteUseCase
  let inviteRepository: InviteRepository

  beforeEach(() => {
    inviteRepository = {
      create: vi.fn(),
      findByToken: vi.fn(),
      findByIntentId: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as InviteRepository

    sut = new ValidateInviteUseCase(inviteRepository)
  })

  describe('Success Cases', () => {
    it('should validate a valid invite token', async () => {
      const mockInvite: Invite = {
        id: '123',
        intentId: '456',
        token: 'valid-token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'PENDING',
        createdAt: new Date(),
      }

      vi.mocked(inviteRepository.findByToken).mockResolvedValue(mockInvite)

      const result = await sut.execute({ token: 'valid-token-123' })

      expect(result.valid).toBe(true)
      expect(result.intentId).toBe('456')
      expect(result.reason).toBeUndefined()
    })

    it('should return invite details with intentId', async () => {
      const mockInvite: Invite = {
        id: '123',
        intentId: '789',
        token: 'token-abc',
        expiresAt: new Date(Date.now() + 1000000),
        status: 'PENDING',
        createdAt: new Date(),
      }

      vi.mocked(inviteRepository.findByToken).mockResolvedValue(mockInvite)

      const result = await sut.execute({ token: 'token-abc' })

      expect(result.valid).toBe(true)
      expect(result.intentId).toBe('789')
      expect(result.expiresAt).toEqual(mockInvite.expiresAt)
    })
  })

  describe('Error Cases', () => {
    it('should return invalid when token not found', async () => {
      vi.mocked(inviteRepository.findByToken).mockResolvedValue(null)

      const result = await sut.execute({ token: 'non-existent-token' })

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('invalid')
    })

    it('should return used when invite is already used', async () => {
      const mockInvite: Invite = {
        id: '123',
        intentId: '456',
        token: 'used-token',
        expiresAt: new Date(Date.now() + 1000000),
        status: 'USED',
        createdAt: new Date(),
      }

      vi.mocked(inviteRepository.findByToken).mockResolvedValue(mockInvite)

      const result = await sut.execute({ token: 'used-token' })

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('used')
    })

    it('should return expired when invite is expired', async () => {
      const mockInvite: Invite = {
        id: '123',
        intentId: '456',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        status: 'PENDING',
        createdAt: new Date(),
      }

      vi.mocked(inviteRepository.findByToken).mockResolvedValue(mockInvite)
      vi.mocked(inviteRepository.updateStatus).mockResolvedValue(mockInvite)

      const result = await sut.execute({ token: 'expired-token' })

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('expired')
    })

    it('should update status to EXPIRED when checking expired invite', async () => {
      const mockInvite: Invite = {
        id: '123',
        intentId: '456',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000),
        status: 'PENDING',
        createdAt: new Date(),
      }

      vi.mocked(inviteRepository.findByToken).mockResolvedValue(mockInvite)
      vi.mocked(inviteRepository.updateStatus).mockResolvedValue(mockInvite)

      await sut.execute({ token: 'expired-token' })

      expect(inviteRepository.updateStatus).toHaveBeenCalledWith({
        id: '123',
        status: 'EXPIRED',
      })
    })

    it('should not update status if already marked as EXPIRED', async () => {
      const mockInvite: Invite = {
        id: '123',
        intentId: '456',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000),
        status: 'EXPIRED',
        createdAt: new Date(),
      }

      vi.mocked(inviteRepository.findByToken).mockResolvedValue(mockInvite)

      await sut.execute({ token: 'expired-token' })

      expect(inviteRepository.updateStatus).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty token', async () => {
      vi.mocked(inviteRepository.findByToken).mockResolvedValue(null)

      const result = await sut.execute({ token: '' })

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('invalid')
    })

    it('should handle token with special characters', async () => {
      vi.mocked(inviteRepository.findByToken).mockResolvedValue(null)

      const result = await sut.execute({ token: 'token-with-@#$%' })

      expect(result.valid).toBe(false)
      expect(result.reason).toBe('invalid')
    })

    it('should validate token expiration at exact timestamp', async () => {
      const now = Date.now()
      const mockInvite: Invite = {
        id: '123',
        intentId: '456',
        token: 'exact-time-token',
        expiresAt: new Date(now + 100), // Expires in 100ms
        status: 'PENDING',
        createdAt: new Date(),
      }

      vi.mocked(inviteRepository.findByToken).mockResolvedValue(mockInvite)

      const result = await sut.execute({ token: 'exact-time-token' })

      expect(result.valid).toBe(true)
    })
  })
})
