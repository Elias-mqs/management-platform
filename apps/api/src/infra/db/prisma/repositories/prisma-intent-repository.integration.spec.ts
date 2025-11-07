import { describe, it, expect } from 'vitest'
import { PrismaIntentRepository } from './prisma-intent-repository'
import { prisma } from '../../../../../test/setup-integration'

describe('PrismaIntentRepository Integration', () => {
  const repository = new PrismaIntentRepository(prisma)

  describe('create', () => {
    it('should create intent in database', async () => {
      const intentData = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999',
        notes: 'Interested in joining',
      }

      const intent = await repository.create(intentData)

      expect(intent.id).toBeTruthy()
      expect(intent.fullName).toBe('John Doe')
      expect(intent.email).toBe('john@example.com')
      expect(intent.status).toBe('PENDING')
    })

    it('should set PENDING status by default', async () => {
      const intent = await repository.create({
        fullName: 'Jane Smith',
        email: 'jane@example.com',
      })

      expect(intent.status).toBe('PENDING')
    })

    it('should set createdAt automatically', async () => {
      const intent = await repository.create({
        fullName: 'Bob Johnson',
        email: 'bob@example.com',
      })

      expect(intent.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('findById', () => {
    it('should find intent by id', async () => {
      const created = await repository.create({
        fullName: 'Find Test',
        email: 'find@example.com',
      })

      const found = await repository.findById(created.id)

      expect(found).toBeTruthy()
      expect(found?.id).toBe(created.id)
      expect(found?.email).toBe('find@example.com')
    })

    it('should return null when not found', async () => {
      const found = await repository.findById('non-existent-id')

      expect(found).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should find intent by email', async () => {
      await repository.create({
        fullName: 'Email Test',
        email: 'emailtest@example.com',
      })

      const found = await repository.findByEmail('emailtest@example.com')

      expect(found).toBeTruthy()
      expect(found?.email).toBe('emailtest@example.com')
    })

    it('should return most recent intent for email', async () => {
      const email = 'multiple@example.com'
      
      await repository.create({
        fullName: 'First',
        email,
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const second = await repository.create({
        fullName: 'Second',
        email,
      })

      const found = await repository.findByEmail(email)

      expect(found?.id).toBe(second.id)
    })
  })

  describe('list', () => {
    it('should list all intents', async () => {
      await repository.create({
        fullName: 'List Test 1',
        email: 'list1@example.com',
      })

      await repository.create({
        fullName: 'List Test 2',
        email: 'list2@example.com',
      })

      const result = await repository.list({})

      expect(result.items.length).toBeGreaterThanOrEqual(2)
      expect(result.total).toBeGreaterThanOrEqual(2)
    })

    it('should filter by status', async () => {
      const created = await repository.create({
        fullName: 'Filter Test',
        email: 'filter@example.com',
      })

      await repository.updateStatus({
        id: created.id,
        status: 'APPROVED',
        reviewedBy: 'admin',
      })

      const result = await repository.list({ status: 'APPROVED' })

      expect(result.items.some(i => i.id === created.id)).toBe(true)
    })

    it('should paginate results', async () => {
      const result = await repository.list({
        page: 1,
        pageSize: 5,
      })

      expect(result.items.length).toBeLessThanOrEqual(5)
    })

    it('should sort by createdAt DESC', async () => {
      const first = await repository.create({
        fullName: 'First',
        email: 'first-sort@example.com',
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const second = await repository.create({
        fullName: 'Second',
        email: 'second-sort@example.com',
      })

      const result = await repository.list({})

      const firstIndex = result.items.findIndex(i => i.id === first.id)
      const secondIndex = result.items.findIndex(i => i.id === second.id)

      expect(secondIndex).toBeLessThan(firstIndex)
    })
  })

  describe('updateStatus', () => {
    it('should update intent status', async () => {
      const created = await repository.create({
        fullName: 'Update Test',
        email: 'update@example.com',
      })

      const updated = await repository.updateStatus({
        id: created.id,
        status: 'APPROVED',
        reviewedBy: 'admin@test.com',
      })

      expect(updated.status).toBe('APPROVED')
      expect(updated.reviewedBy).toBe('admin@test.com')
    })

    it('should update reviewedAt and reviewedBy', async () => {
      const created = await repository.create({
        fullName: 'Review Test',
        email: 'review@example.com',
      })

      const updated = await repository.updateStatus({
        id: created.id,
        status: 'REJECTED',
        reviewedBy: 'admin@test.com',
      })

      expect(updated.reviewedAt).toBeInstanceOf(Date)
      expect(updated.reviewedBy).toBe('admin@test.com')
    })

    it('should throw error for non-existent intent', async () => {
      await expect(
        repository.updateStatus({
          id: 'non-existent',
          status: 'APPROVED',
          reviewedBy: 'admin',
        })
      ).rejects.toThrow()
    })
  })
})
