import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { createTestApp, cleanDatabase, createTestIntent } from '../../../../test/helpers/http-test-helper'
import { env } from '@/config/env'

describe('Admin Intent Routes', () => {
  let app: FastifyInstance
  const adminKey = env.ADMIN_KEY

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await cleanDatabase()
  })

  describe('GET /admin/intents', () => {
    beforeEach(async () => {
      await createTestIntent({ fullName: 'User 1', email: 'user1@test.com', status: 'PENDING' })
      await createTestIntent({ fullName: 'User 2', email: 'user2@test.com', status: 'APPROVED' })
      await createTestIntent({ fullName: 'User 3', email: 'user3@test.com', status: 'REJECTED' })
      await createTestIntent({ fullName: 'User 4', email: 'user4@test.com', status: 'PENDING' })
    })

    it('should return 401 without admin key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/intents',
      })

      // Middleware returns 401 for missing admin key
      expect(response.statusCode).toBe(401)
    })

    it('should return 401 with invalid admin key', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/intents',
        headers: {
          'x-admin-key': 'invalid-key',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should list all intents', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/intents',
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.items).toHaveLength(4)
      expect(body.total).toBe(4)
      expect(body.page).toBe(1)
    })

    it('should filter by status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/intents?status=PENDING',
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.items).toHaveLength(2)
      expect(body.total).toBe(2)
      expect(body.items.every((item: any) => item.status === 'PENDING')).toBe(true)
    })

    it('should support pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/intents?page=1&pageSize=2',
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.items).toHaveLength(2)
      expect(body.total).toBe(4)
      expect(body.page).toBe(1)
      expect(body.pageSize).toBe(2)
      expect(body.totalPages).toBe(2)
    })

    it('should return items in descending order by createdAt', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/intents',
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      const dates = body.items.map((item: any) => new Date(item.createdAt).getTime())
      const sortedDates = [...dates].sort((a, b) => b - a)
      expect(dates).toEqual(sortedDates)
    })

    it('should include all intent fields', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/intents',
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      const intent = body.items[0]
      expect(intent).toHaveProperty('id')
      expect(intent).toHaveProperty('fullName')
      expect(intent).toHaveProperty('email')
      expect(intent).toHaveProperty('status')
      expect(intent).toHaveProperty('createdAt')
    })
  })

  describe('POST /intents/:id/approve', () => {
    it('should return 401 without admin key', async () => {
      const intent = await createTestIntent()

      const response = await app.inject({
        method: 'POST',
        url: `/api/admin/intents/${intent.id}/approve`,
      })

      // Middleware returns 401 for missing admin key
      expect(response.statusCode).toBe(401)
    })

    it('should approve a pending intent and create invite', async () => {
      const intent = await createTestIntent({ status: 'PENDING' })

      const response = await app.inject({
        method: 'POST',
        url: `/api/admin/intents/${intent.id}/approve`,
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.intent.status).toBe('APPROVED')
      expect(body.invite).toHaveProperty('token')
      expect(body.invite).toHaveProperty('expiresAt')
    })

    it('should return 404 for non-existent intent', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/intents/00000000-0000-0000-0000-000000000000/approve',
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 400 when trying to approve already approved intent', async () => {
      const intent = await createTestIntent({ status: 'APPROVED' })

      const response = await app.inject({
        method: 'POST',
        url: `/api/admin/intents/${intent.id}/approve`,
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when trying to approve rejected intent', async () => {
      const intent = await createTestIntent({ status: 'REJECTED' })

      const response = await app.inject({
        method: 'POST',
        url: `/api/admin/intents/${intent.id}/approve`,
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should set reviewedBy field from header', async () => {
      const intent = await createTestIntent({ status: 'PENDING' })

      const response = await app.inject({
        method: 'POST',
        url: `/api/admin/intents/${intent.id}/approve`,
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.intent.reviewedBy).toBeDefined()
      expect(body.intent.reviewedAt).toBeDefined()
    })
  })

  describe('POST /intents/:id/reject', () => {
    it('should return 401 without admin key', async () => {
      const intent = await createTestIntent()

      const response = await app.inject({
        method: 'POST',
        url: `/api/admin/intents/${intent.id}/reject`,
      })

      // Middleware returns 401 for missing admin key
      expect(response.statusCode).toBe(401)
    })

    it('should reject a pending intent', async () => {
      const intent = await createTestIntent({ status: 'PENDING' })

      const response = await app.inject({
        method: 'POST',
        url: `/api/admin/intents/${intent.id}/reject`,
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.intent.status).toBe('REJECTED')
      expect(body.intent.reviewedBy).toBeDefined()
      expect(body.intent.reviewedAt).toBeDefined()
    })

    it('should return 404 for non-existent intent', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/intents/00000000-0000-0000-0000-000000000000/reject',
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 400 when trying to reject already rejected intent', async () => {
      const intent = await createTestIntent({ status: 'REJECTED' })

      const response = await app.inject({
        method: 'POST',
        url: `/api/admin/intents/${intent.id}/reject`,
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when trying to reject approved intent', async () => {
      const intent = await createTestIntent({ status: 'APPROVED' })

      const response = await app.inject({
        method: 'POST',
        url: `/api/admin/intents/${intent.id}/reject`,
        headers: {
          'x-admin-key': adminKey,
        },
      })

      expect(response.statusCode).toBe(400)
    })
  })
})
