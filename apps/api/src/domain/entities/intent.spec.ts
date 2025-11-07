import { describe, it, expect } from 'vitest'
import { IntentEntity, Intent, IntentStatus } from './intent'

describe('IntentEntity', () => {
  const mockIntent: Intent = {
    id: '456',
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+5511988888888',
    notes: 'Interested in joining',
    status: 'PENDING' as IntentStatus,
    createdAt: new Date('2024-01-15'),
    reviewedAt: null,
    reviewedBy: null,
  }

  describe('Getters', () => {
    it('should return all properties correctly', () => {
      const entity = new IntentEntity(mockIntent)

      expect(entity.id).toBe('456')
      expect(entity.fullName).toBe('Jane Smith')
      expect(entity.email).toBe('jane@example.com')
      expect(entity.phone).toBe('+5511988888888')
      expect(entity.notes).toBe('Interested in joining')
      expect(entity.status).toBe('PENDING')
      expect(entity.createdAt).toEqual(new Date('2024-01-15'))
      expect(entity.reviewedAt).toBeNull()
      expect(entity.reviewedBy).toBeNull()
    })
  })

  describe('Status Check Methods', () => {
    it('should return true for isPending() when status is PENDING', () => {
      const entity = new IntentEntity(mockIntent)

      expect(entity.isPending()).toBe(true)
      expect(entity.isApproved()).toBe(false)
      expect(entity.isRejected()).toBe(false)
    })

    it('should return true for isApproved() when status is APPROVED', () => {
      const approvedIntent = { ...mockIntent, status: 'APPROVED' as IntentStatus }
      const entity = new IntentEntity(approvedIntent)

      expect(entity.isApproved()).toBe(true)
      expect(entity.isPending()).toBe(false)
      expect(entity.isRejected()).toBe(false)
    })

    it('should return true for isRejected() when status is REJECTED', () => {
      const rejectedIntent = { ...mockIntent, status: 'REJECTED' as IntentStatus }
      const entity = new IntentEntity(rejectedIntent)

      expect(entity.isRejected()).toBe(true)
      expect(entity.isPending()).toBe(false)
      expect(entity.isApproved()).toBe(false)
    })
  })

  describe('canBeApproved()', () => {
    it('should return true when status is PENDING', () => {
      const entity = new IntentEntity(mockIntent)

      expect(entity.canBeApproved()).toBe(true)
    })

    it('should return false when status is APPROVED', () => {
      const approvedIntent = { ...mockIntent, status: 'APPROVED' as IntentStatus }
      const entity = new IntentEntity(approvedIntent)

      expect(entity.canBeApproved()).toBe(false)
    })

    it('should return false when status is REJECTED', () => {
      const rejectedIntent = { ...mockIntent, status: 'REJECTED' as IntentStatus }
      const entity = new IntentEntity(rejectedIntent)

      expect(entity.canBeApproved()).toBe(false)
    })
  })

  describe('canBeRejected()', () => {
    it('should return true when status is PENDING', () => {
      const entity = new IntentEntity(mockIntent)

      expect(entity.canBeRejected()).toBe(true)
    })

    it('should return false when status is APPROVED', () => {
      const approvedIntent = { ...mockIntent, status: 'APPROVED' as IntentStatus }
      const entity = new IntentEntity(approvedIntent)

      expect(entity.canBeRejected()).toBe(false)
    })

    it('should return false when status is REJECTED', () => {
      const rejectedIntent = { ...mockIntent, status: 'REJECTED' as IntentStatus }
      const entity = new IntentEntity(rejectedIntent)

      expect(entity.canBeRejected()).toBe(false)
    })
  })

  describe('toJSON()', () => {
    it('should return complete intent data', () => {
      const entity = new IntentEntity(mockIntent)
      const json = entity.toJSON()

      expect(json).toEqual(mockIntent)
      expect(json).toHaveProperty('id', '456')
      expect(json).toHaveProperty('status', 'PENDING')
    })
  })
})
