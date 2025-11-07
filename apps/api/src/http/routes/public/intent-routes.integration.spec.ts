import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { createTestApp, cleanDatabase } from '../../../../test/helpers/http-test-helper'

describe('Intent Routes (Public)', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await cleanDatabase()
  })

  describe('POST /intents', () => {
    it('should create a new intent', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/intents',
        payload: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '+5511999999999',
          notes: 'I want to join the network',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.intent).toHaveProperty('id')
      expect(body.intent.fullName).toBe('John Doe')
      expect(body.intent.email).toBe('john@example.com')
      expect(body.intent.status).toBe('PENDING')
    })

    it('should set initial status as PENDING', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/intents',
        payload: {
          fullName: 'Jane Doe',
          email: 'jane@example.com',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.intent.status).toBe('PENDING')
      expect(body.intent.reviewedAt).toBeUndefined()
      expect(body.intent.reviewedBy).toBeUndefined()
    })

    it('should return 409 when email already exists', async () => {
      // Create first intent
      await app.inject({
        method: 'POST',
        url: '/api/intents',
        payload: {
          fullName: 'John Doe',
          email: 'duplicate@example.com',
        },
      })

      // Try to create second intent with same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/intents',
        payload: {
          fullName: 'Jane Doe',
          email: 'duplicate@example.com',
        },
      })

      expect(response.statusCode).toBe(409)
    })

    it('should return 400 when fullName is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/intents',
        payload: {
          email: 'test@example.com',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when email is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/intents',
        payload: {
          fullName: 'John Doe',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when email is invalid', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/intents',
        payload: {
          fullName: 'John Doe',
          email: 'invalid-email',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when fullName is too short', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/intents',
        payload: {
          fullName: 'Jo',
          email: 'test@example.com',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should accept optional phone and notes', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/intents',
        payload: {
          fullName: 'John Doe',
          email: 'john2@example.com',
          phone: '+5511999999999',
          notes: 'Some notes',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.intent.phone).toBe('+5511999999999')
      expect(body.intent.notes).toBe('Some notes')
    })

    it('should work without optional fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/intents',
        payload: {
          fullName: 'John Doe',
          email: 'john3@example.com',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.intent.phone).toBeNull()
      expect(body.intent.notes).toBeNull()
    })
  })
})
