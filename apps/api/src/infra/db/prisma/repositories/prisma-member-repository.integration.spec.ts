import { describe, it, expect } from 'vitest'
import { PrismaMemberRepository } from './prisma-member-repository'
import { prisma } from '../../../../../test/setup-integration'

describe('PrismaMemberRepository Integration', () => {
  const repository = new PrismaMemberRepository(prisma)

  describe('create', () => {
    it('should create member in database', async () => {
      const memberData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999',
        password: 'hashed_password_123',
        role: 'MEMBER' as const,
      }

      const member = await repository.create(memberData)

      expect(member.id).toBeTruthy()
      expect(member.name).toBe('John Doe')
      expect(member.email).toBe('john@example.com')
      expect(member.status).toBe('ACTIVE')
    })

    it('should return created member with id', async () => {
      const memberData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'hashed_password_456',
      }

      const member = await repository.create(memberData)

      expect(member).toHaveProperty('id')
      expect(member).toHaveProperty('createdAt')
      expect(member).toHaveProperty('updatedAt')
    })

    it('should set default role to MEMBER', async () => {
      const memberData = {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: 'hashed_password_789',
      }

      const member = await repository.create(memberData)

      expect(member.role).toBe('MEMBER')
    })

    it('should throw error on duplicate email', async () => {
      const memberData = {
        name: 'Alice Brown',
        email: 'duplicate@example.com',
        password: 'password',
      }

      await repository.create(memberData)

      await expect(repository.create(memberData)).rejects.toThrow()
    })
  })

  describe('findById', () => {
    it('should find member by id', async () => {
      const created = await repository.create({
        name: 'Find By ID Test',
        email: 'findbyid@example.com',
        password: 'password',
      })

      const found = await repository.findById(created.id)

      expect(found).toBeTruthy()
      expect(found?.id).toBe(created.id)
      expect(found?.email).toBe('findbyid@example.com')
    })

    it('should return null when not found', async () => {
      const found = await repository.findById('non-existent-id')

      expect(found).toBeNull()
    })
  })

  describe('findByEmail', () => {
    it('should find member by email', async () => {
      await repository.create({
        name: 'Find By Email Test',
        email: 'findbyemail@example.com',
        password: 'password',
      })

      const found = await repository.findByEmail('findbyemail@example.com')

      expect(found).toBeTruthy()
      expect(found?.email).toBe('findbyemail@example.com')
    })

    it('should return null when not found', async () => {
      const found = await repository.findByEmail('nonexistent@example.com')

      expect(found).toBeNull()
    })

    it('should be case-sensitive', async () => {
      await repository.create({
        name: 'Case Test',
        email: 'lowercase@example.com',
        password: 'password',
      })

      const found = await repository.findByEmail('LOWERCASE@example.com')

      expect(found).toBeNull()
    })
  })
})
