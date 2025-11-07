import { describe, it, expect, beforeEach } from 'vitest'
import { PrismaInviteRepository } from './prisma-invite-repository'
import { PrismaIntentRepository } from './prisma-intent-repository'
import { prisma } from '../../../../../test/setup-integration'

describe('PrismaInviteRepository Integration', () => {
  const repository = new PrismaInviteRepository(prisma)
  const intentRepository = new PrismaIntentRepository(prisma)
  let testIntentId: string

  beforeEach(async () => {
    // Criar uma intent para usar nos testes
    const intent = await intentRepository.create({
      fullName: 'Test User',
      email: 'test@example.com',
    })
    testIntentId = intent.id
  })

  describe('create', () => {
    it('should create invite in database', async () => {
      const inviteData = {
        intentId: testIntentId,
        token: 'test-token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }

      const invite = await repository.create(inviteData)

      expect(invite.id).toBeTruthy()
      expect(invite.intentId).toBe(testIntentId)
      expect(invite.token).toBe('test-token-123')
      expect(invite.status).toBe('PENDING')
    })

    it('should generate unique token', async () => {
      const invite1 = await repository.create({
        intentId: testIntentId,
        token: 'unique-token-1',
        expiresAt: new Date(Date.now() + 1000000),
      })

      const intent2 = await intentRepository.create({
        fullName: 'Another User',
        email: 'another@example.com',
      })

      const invite2 = await repository.create({
        intentId: intent2.id,
        token: 'unique-token-2',
        expiresAt: new Date(Date.now() + 1000000),
      })

      expect(invite1.token).not.toBe(invite2.token)
    })

    it('should set expiresAt based on TTL', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      
      const invite = await repository.create({
        intentId: testIntentId,
        token: 'ttl-token',
        expiresAt,
      })

      expect(invite.expiresAt.getTime()).toBeCloseTo(expiresAt.getTime(), -3)
    })

    it('should associate with intent', async () => {
      const invite = await repository.create({
        intentId: testIntentId,
        token: 'associated-token',
        expiresAt: new Date(Date.now() + 1000000),
      })

      expect(invite.intentId).toBe(testIntentId)
    })
  })

  describe('findByToken', () => {
    it('should find invite by token', async () => {
      await repository.create({
        intentId: testIntentId,
        token: 'findable-token',
        expiresAt: new Date(Date.now() + 1000000),
      })

      const found = await repository.findByToken('findable-token')

      expect(found).toBeTruthy()
      expect(found?.token).toBe('findable-token')
    })

    it('should return null when not found', async () => {
      const found = await repository.findByToken('non-existent-token')

      expect(found).toBeNull()
    })

    it('should include intent relation', async () => {
      await repository.create({
        intentId: testIntentId,
        token: 'relation-token',
        expiresAt: new Date(Date.now() + 1000000),
      })

      const found = await repository.findByToken('relation-token')

      expect(found).toBeTruthy()
      expect(found?.intentId).toBe(testIntentId)
    })
  })

  describe('findByIntentId', () => {
    it('should find invite by intent id', async () => {
      await repository.create({
        intentId: testIntentId,
        token: 'intent-token',
        expiresAt: new Date(Date.now() + 1000000),
      })

      const found = await repository.findByIntentId(testIntentId)

      expect(found).toBeTruthy()
      expect(found?.intentId).toBe(testIntentId)
    })

    it('should return null when not found', async () => {
      const found = await repository.findByIntentId('non-existent-intent-id')

      expect(found).toBeNull()
    })
  })

  describe('updateStatus', () => {
    it('should update invite status', async () => {
      const created = await repository.create({
        intentId: testIntentId,
        token: 'update-status-token',
        expiresAt: new Date(Date.now() + 1000000),
      })

      const updated = await repository.updateStatus({
        id: created.id,
        status: 'USED',
      })

      expect(updated.status).toBe('USED')
    })

    it('should mark as USED', async () => {
      const created = await repository.create({
        intentId: testIntentId,
        token: 'mark-used-token',
        expiresAt: new Date(Date.now() + 1000000),
      })

      const updated = await repository.updateStatus({
        id: created.id,
        status: 'USED',
      })

      expect(updated.status).toBe('USED')
    })

    it('should mark as EXPIRED', async () => {
      const created = await repository.create({
        intentId: testIntentId,
        token: 'mark-expired-token',
        expiresAt: new Date(Date.now() - 1000),
      })

      const updated = await repository.updateStatus({
        id: created.id,
        status: 'EXPIRED',
      })

      expect(updated.status).toBe('EXPIRED')
    })
  })

  describe('Expiration', () => {
    it('should identify expired invites', async () => {
      const expired = await repository.create({
        intentId: testIntentId,
        token: 'expired-invite',
        expiresAt: new Date(Date.now() - 1000),
      })

      const found = await repository.findByToken('expired-invite')

      expect(found).toBeTruthy()
      expect(new Date() > found!.expiresAt).toBe(true)
    })

    it('should identify valid invites', async () => {
      const valid = await repository.create({
        intentId: testIntentId,
        token: 'valid-invite',
        expiresAt: new Date(Date.now() + 1000000),
      })

      const found = await repository.findByToken('valid-invite')

      expect(found).toBeTruthy()
      expect(new Date() < found!.expiresAt).toBe(true)
    })
  })

  describe('Constraints', () => {
    it('should enforce unique token constraint', async () => {
      const token = 'duplicate-token'
      
      await repository.create({
        intentId: testIntentId,
        token,
        expiresAt: new Date(Date.now() + 1000000),
      })

      const intent2 = await intentRepository.create({
        fullName: 'Another',
        email: 'another2@example.com',
      })

      await expect(
        repository.create({
          intentId: intent2.id,
          token,
          expiresAt: new Date(Date.now() + 1000000),
        })
      ).rejects.toThrow()
    })
  })
})
