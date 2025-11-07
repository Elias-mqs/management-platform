import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FastifyInstance } from 'fastify'
import { createTestApp } from '../../../test/helpers/http-test-helper'
import { env } from '@/config/env'

describe('Admin Auth Middleware', () => {
  let app: FastifyInstance
  const adminKey = env.ADMIN_KEY

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Admin Key Authentication', () => {
    const endpoints = [
      { method: 'GET' as const, url: '/api/admin/intents' },
      { method: 'POST' as const, url: '/api/admin/intents/00000000-0000-0000-0000-000000000000/approve' },
      { method: 'POST' as const, url: '/api/admin/intents/00000000-0000-0000-0000-000000000000/reject' },
    ]

    endpoints.forEach(({ method, url }) => {
      it(`should allow access with valid admin key for ${method} ${url}`, async () => {
        const response = await app.inject({
          method,
          url,
          headers: {
            'x-admin-key': adminKey,
          },
        })

        // Should not return 401 (may return 404 for non-existent resources)
        expect(response.statusCode).not.toBe(401)
      })

      it(`should reject access with invalid admin key for ${method} ${url}`, async () => {
        const response = await app.inject({
          method,
          url,
          headers: {
            'x-admin-key': 'invalid-key',
          },
        })

        expect(response.statusCode).toBe(401)
      })

      it(`should reject access without admin key for ${method} ${url}`, async () => {
        const response = await app.inject({
          method,
          url,
        })

        // Middleware returns 401 for missing admin key
        expect(response.statusCode).toBe(401)
      })
    })

    it('should return 401 with invalid admin key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/intents',
        headers: {
          'x-admin-key': 'wrong-key',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return consistent error structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/intents',
      })

      // Middleware returns 401 for missing admin key
      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('error')
      expect(body.error).toHaveProperty('code')
      expect(body.error.code).toBe('UNAUTHORIZED')
      expect(body.error).toHaveProperty('message')
    })
  })
})
