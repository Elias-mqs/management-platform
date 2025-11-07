import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RejectIntentUseCase } from './reject-intent'
import type { IntentRepository } from '@/application/ports/intent-repository'
import type { Intent } from '@/domain/entities/intent'

describe('RejectIntentUseCase', () => {
  let sut: RejectIntentUseCase
  let intentRepository: IntentRepository

  beforeEach(() => {
    intentRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      list: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as IntentRepository

    sut = new RejectIntentUseCase(intentRepository)
  })

  describe('Success Cases', () => {
    it('should reject a pending intent successfully', async () => {
      const mockIntent: Intent = {
        id: '123',
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999',
        notes: 'Test',
        status: 'PENDING',
        createdAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
      }

      const rejectedIntent: Intent = {
        ...mockIntent,
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: 'admin@test.com',
      }

      vi.mocked(intentRepository.findById).mockResolvedValue(mockIntent)
      vi.mocked(intentRepository.updateStatus).mockResolvedValue(rejectedIntent)

      const result = await sut.execute({
        intentId: '123',
        reviewedBy: 'admin@test.com',
      })

      expect(result.intent.status).toBe('REJECTED')
      expect(intentRepository.findById).toHaveBeenCalledWith('123')
      expect(intentRepository.updateStatus).toHaveBeenCalledWith({
        id: '123',
        status: 'REJECTED',
        reviewedBy: 'admin@test.com',
      })
    })

    it('should set reviewedBy field', async () => {
      const mockIntent: Intent = {
        id: '123',
        fullName: 'John Doe',
        email: 'john@example.com',
        status: 'PENDING',
        createdAt: new Date(),
      } as Intent

      const rejectedIntent: Intent = {
        ...mockIntent,
        status: 'REJECTED',
        reviewedBy: 'admin@test.com',
      }

      vi.mocked(intentRepository.findById).mockResolvedValue(mockIntent)
      vi.mocked(intentRepository.updateStatus).mockResolvedValue(rejectedIntent)

      const result = await sut.execute({
        intentId: '123',
        reviewedBy: 'admin@test.com',
      })

      expect(result.intent.reviewedBy).toBe('admin@test.com')
    })
  })

  describe('Error Cases', () => {
    it('should throw error when intent not found', async () => {
      vi.mocked(intentRepository.findById).mockResolvedValue(null)

      await expect(
        sut.execute({
          intentId: '999',
          reviewedBy: 'admin@test.com',
        })
      ).rejects.toThrow('Intent not found')
    })

    it('should throw error when intent is already APPROVED', async () => {
      const approvedIntent: Intent = {
        id: '123',
        fullName: 'John Doe',
        email: 'john@example.com',
        status: 'APPROVED',
        createdAt: new Date(),
      } as Intent

      vi.mocked(intentRepository.findById).mockResolvedValue(approvedIntent)

      await expect(
        sut.execute({
          intentId: '123',
          reviewedBy: 'admin@test.com',
        })
      ).rejects.toThrow('Intent cannot be rejected')
    })

    it('should throw error when intent is already REJECTED', async () => {
      const rejectedIntent: Intent = {
        id: '123',
        fullName: 'John Doe',
        email: 'john@example.com',
        status: 'REJECTED',
        createdAt: new Date(),
      } as Intent

      vi.mocked(intentRepository.findById).mockResolvedValue(rejectedIntent)

      await expect(
        sut.execute({
          intentId: '123',
          reviewedBy: 'admin@test.com',
        })
      ).rejects.toThrow('Intent cannot be rejected')
    })

    it('should not call updateStatus when intent cannot be rejected', async () => {
      const approvedIntent: Intent = {
        id: '123',
        fullName: 'John Doe',
        email: 'john@example.com',
        status: 'APPROVED',
        createdAt: new Date(),
      } as Intent

      vi.mocked(intentRepository.findById).mockResolvedValue(approvedIntent)

      try {
        await sut.execute({
          intentId: '123',
          reviewedBy: 'admin@test.com',
        })
      } catch (error) {
        // Expected error
      }

      expect(intentRepository.updateStatus).not.toHaveBeenCalled()
    })
  })
})
