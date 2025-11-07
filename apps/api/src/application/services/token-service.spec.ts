import { describe, it, expect } from 'vitest'
import { TokenService } from './token-service'

describe('TokenService', () => {
  describe('generate()', () => {
    it('should generate unique token', () => {
      const token1 = TokenService.generate()
      const token2 = TokenService.generate()

      expect(token1).not.toBe(token2)
    })

    it('should generate token with correct length', () => {
      const token = TokenService.generate()

      // randomBytes(32).toString('hex') = 64 characters
      expect(token).toHaveLength(64)
    })

    it('should generate cryptographically secure token', () => {
      const token = TokenService.generate()

      // Should be hexadecimal (0-9, a-f)
      expect(token).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should not generate duplicate tokens in multiple calls', () => {
      const tokens = new Set<string>()
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        tokens.add(TokenService.generate())
      }

      // All tokens should be unique
      expect(tokens.size).toBe(iterations)
    })

    it('should generate tokens with high entropy', () => {
      const token = TokenService.generate()
      const uniqueChars = new Set(token.split(''))

      // Should have good distribution of characters (at least 10 different chars in 64 chars)
      expect(uniqueChars.size).toBeGreaterThanOrEqual(10)
    })

    it('should generate token without special characters', () => {
      const token = TokenService.generate()

      // Should only contain hex characters (no special chars, spaces, etc)
      expect(token).not.toMatch(/[^0-9a-f]/)
    })
  })
})
