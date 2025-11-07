import { describe, it, expect } from 'vitest'
import { MemberEntity, Member, MemberRole, MemberStatus } from './member'

describe('MemberEntity', () => {
  const mockMember: Member = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+5511999999999',
    role: 'MEMBER' as MemberRole,
    status: 'ACTIVE' as MemberStatus,
    password: 'hashed_password',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  }

  describe('Getters', () => {
    it('should return all properties correctly', () => {
      const entity = new MemberEntity(mockMember)

      expect(entity.id).toBe('123')
      expect(entity.name).toBe('John Doe')
      expect(entity.email).toBe('john@example.com')
      expect(entity.phone).toBe('+5511999999999')
      expect(entity.role).toBe('MEMBER')
      expect(entity.status).toBe('ACTIVE')
      expect(entity.password).toBe('hashed_password')
      expect(entity.createdAt).toEqual(new Date('2024-01-01'))
      expect(entity.updatedAt).toEqual(new Date('2024-01-01'))
    })
  })

  describe('isAdmin()', () => {
    it('should return true when role is ADMIN', () => {
      const adminMember = { ...mockMember, role: 'ADMIN' as MemberRole }
      const entity = new MemberEntity(adminMember)

      expect(entity.isAdmin()).toBe(true)
    })

    it('should return false when role is MEMBER', () => {
      const entity = new MemberEntity(mockMember)

      expect(entity.isAdmin()).toBe(false)
    })
  })

  describe('isActive()', () => {
    it('should return true when status is ACTIVE', () => {
      const entity = new MemberEntity(mockMember)

      expect(entity.isActive()).toBe(true)
    })

    it('should return false when status is INACTIVE', () => {
      const inactiveMember = { ...mockMember, status: 'INACTIVE' as MemberStatus }
      const entity = new MemberEntity(inactiveMember)

      expect(entity.isActive()).toBe(false)
    })
  })

  describe('isInactive()', () => {
    it('should return true when status is INACTIVE', () => {
      const inactiveMember = { ...mockMember, status: 'INACTIVE' as MemberStatus }
      const entity = new MemberEntity(inactiveMember)

      expect(entity.isInactive()).toBe(true)
    })

    it('should return false when status is ACTIVE', () => {
      const entity = new MemberEntity(mockMember)

      expect(entity.isInactive()).toBe(false)
    })
  })

  describe('toJSON()', () => {
    it('should return member data without password', () => {
      const entity = new MemberEntity(mockMember)
      const json = entity.toJSON()

      expect(json).not.toHaveProperty('password')
      expect(json).toHaveProperty('id', '123')
      expect(json).toHaveProperty('name', 'John Doe')
      expect(json).toHaveProperty('email', 'john@example.com')
    })
  })
})
