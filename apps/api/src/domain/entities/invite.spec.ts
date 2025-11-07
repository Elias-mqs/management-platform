import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { InviteEntity, Invite, InviteStatus } from './invite'

describe('InviteEntity', () => {
  beforeEach(() => {
    // Mock da data atual para testes de expiração
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-20T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mockInvite: Invite = {
    id: '789',
    intentId: '456',
    token: 'abc123def456',
    expiresAt: new Date('2024-01-27T12:00:00Z'), // 7 dias depois
    status: 'PENDING' as InviteStatus,
    createdAt: new Date('2024-01-20T12:00:00Z'),
  }

  describe('Getters', () => {
    it('should return all properties correctly', () => {
      const entity = new InviteEntity(mockInvite)

      expect(entity.id).toBe('789')
      expect(entity.intentId).toBe('456')
      expect(entity.token).toBe('abc123def456')
      expect(entity.expiresAt).toEqual(new Date('2024-01-27T12:00:00Z'))
      expect(entity.status).toBe('PENDING')
      expect(entity.createdAt).toEqual(new Date('2024-01-20T12:00:00Z'))
    })
  })

  describe('Status Check Methods', () => {
    it('should return true for isPending() when status is PENDING', () => {
      const entity = new InviteEntity(mockInvite)

      expect(entity.isPending()).toBe(true)
      expect(entity.isUsed()).toBe(false)
    })

    it('should return true for isUsed() when status is USED', () => {
      const usedInvite = { ...mockInvite, status: 'USED' as InviteStatus }
      const entity = new InviteEntity(usedInvite)

      expect(entity.isUsed()).toBe(true)
      expect(entity.isPending()).toBe(false)
    })
  })

  describe('isExpired()', () => {
    it('should return false when invite is not expired', () => {
      const entity = new InviteEntity(mockInvite)

      expect(entity.isExpired()).toBe(false)
    })

    it('should return true when current date is after expiresAt', () => {
      vi.setSystemTime(new Date('2024-01-28T12:00:00Z')) // 1 dia depois da expiração
      const entity = new InviteEntity(mockInvite)

      expect(entity.isExpired()).toBe(true)
    })

    it('should return true when status is EXPIRED', () => {
      const expiredInvite = { ...mockInvite, status: 'EXPIRED' as InviteStatus }
      const entity = new InviteEntity(expiredInvite)

      expect(entity.isExpired()).toBe(true)
    })

    it('should return false when expiresAt is exactly now', () => {
      vi.setSystemTime(new Date('2024-01-27T12:00:00Z'))
      const entity = new InviteEntity(mockInvite)

      expect(entity.isExpired()).toBe(false) // Exatamente na hora não é expirado
    })

    it('should return true one second after expiration', () => {
      vi.setSystemTime(new Date('2024-01-27T12:00:01Z'))
      const entity = new InviteEntity(mockInvite)

      expect(entity.isExpired()).toBe(true)
    })
  })

  describe('isValid()', () => {
    it('should return true when invite is PENDING and not expired', () => {
      const entity = new InviteEntity(mockInvite)

      expect(entity.isValid()).toBe(true)
    })

    it('should return false when invite is expired', () => {
      vi.setSystemTime(new Date('2024-01-28T12:00:00Z'))
      const entity = new InviteEntity(mockInvite)

      expect(entity.isValid()).toBe(false)
    })

    it('should return false when invite is USED', () => {
      const usedInvite = { ...mockInvite, status: 'USED' as InviteStatus }
      const entity = new InviteEntity(usedInvite)

      expect(entity.isValid()).toBe(false)
    })
  })

  describe('canBeUsed()', () => {
    it('should return true when invite is valid', () => {
      const entity = new InviteEntity(mockInvite)

      expect(entity.canBeUsed()).toBe(true)
    })

    it('should return false when invite is expired', () => {
      vi.setSystemTime(new Date('2024-01-28T12:00:00Z'))
      const entity = new InviteEntity(mockInvite)

      expect(entity.canBeUsed()).toBe(false)
    })

    it('should return false when invite is already used', () => {
      const usedInvite = { ...mockInvite, status: 'USED' as InviteStatus }
      const entity = new InviteEntity(usedInvite)

      expect(entity.canBeUsed()).toBe(false)
    })
  })

  describe('toJSON()', () => {
    it('should return complete invite data', () => {
      const entity = new InviteEntity(mockInvite)
      const json = entity.toJSON()

      expect(json).toEqual(mockInvite)
      expect(json).toHaveProperty('id', '789')
      expect(json).toHaveProperty('token', 'abc123def456')
    })
  })
})
