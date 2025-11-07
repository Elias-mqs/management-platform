import { describe, it, expect } from 'vitest'
import { HashService } from './hash-service'

describe('HashService', () => {
  describe('hash()', () => {
    it('should hash password using argon2', async () => {
      const password = 'MySecurePassword123!'
      const hash = await HashService.hash(password)

      expect(hash).toBeTruthy()
      expect(hash).not.toBe(password)
      expect(hash).toContain('$argon2') // Argon2 hash prefix
    })

    it('should generate different hashes for same password', async () => {
      const password = 'SamePassword123'
      const hash1 = await HashService.hash(password)
      const hash2 = await HashService.hash(password)

      expect(hash1).not.toBe(hash2) // Different salts
    })
  })

  describe('verify()', () => {
    it('should verify correct password', async () => {
      const password = 'CorrectPassword456'
      const hash = await HashService.hash(password)

      const isValid = await HashService.verify(hash, password)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'CorrectPassword789'
      const hash = await HashService.hash(password)

      const isValid = await HashService.verify(hash, 'WrongPassword')

      expect(isValid).toBe(false)
    })

    it('should return false for invalid hash format', async () => {
      const isValid = await HashService.verify('invalid-hash', 'password')

      expect(isValid).toBe(false)
    })

    it('should handle empty password verification', async () => {
      const hash = await HashService.hash('password')
      const isValid = await HashService.verify(hash, '')

      expect(isValid).toBe(false)
    })
  })
})
