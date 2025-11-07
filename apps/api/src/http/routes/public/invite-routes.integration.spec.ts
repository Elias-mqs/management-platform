import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import {
  createTestApp,
  cleanDatabase,
  createTestIntent,
  createTestInvite,
  getInviteById,
} from '../../../../test/helpers/http-test-helper'

describe('Invite Routes (Public)', () => {
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

  describe('GET /invites/:token (Validate)', () => {
    it('should return valid for a valid invite token', async () => {
      const intent = await createTestIntent({ status: 'APPROVED' })
      const invite = await createTestInvite(intent.id, {
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const response = await app.inject({
        method: 'GET',
        url: `/api/invites/${invite.token}`,
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.valid).toBe(true)
      expect(body.intentId).toBe(intent.id)
      expect(body.expiresAt).toBeDefined()
    })

    it('should return 410 for expired invite', async () => {
      const intent = await createTestIntent({ status: 'APPROVED' })
      const invite = await createTestInvite(intent.id, {
        status: 'EXPIRED',
        expiresAt: new Date(Date.now() - 1000), // Past date
      })

      const response = await app.inject({
        method: 'GET',
        url: `/api/invites/${invite.token}`,
      })

      expect(response.statusCode).toBe(410)
      const body = JSON.parse(response.body)
      expect(body.valid).toBe(false)
      expect(body.reason).toBe('expired')
    })

    it('should return 410 for used invite', async () => {
      const intent = await createTestIntent({ status: 'APPROVED' })
      const invite = await createTestInvite(intent.id, {
        status: 'USED',
      })

      const response = await app.inject({
        method: 'GET',
        url: `/api/invites/${invite.token}`,
      })

      expect(response.statusCode).toBe(410)
      const body = JSON.parse(response.body)
      expect(body.valid).toBe(false)
      expect(body.reason).toBe('used')
    })

    it('should return 404 for non-existent token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/invites/non-existent-token',
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return 410 for invite past expiration date', async () => {
      const intent = await createTestIntent({ status: 'APPROVED' })
      const invite = await createTestInvite(intent.id, {
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      })

      const response = await app.inject({
        method: 'GET',
        url: `/api/invites/${invite.token}`,
      })

      expect(response.statusCode).toBe(410)
      const body = JSON.parse(response.body)
      expect(body.valid).toBe(false)
      expect(body.reason).toBe('expired')
    })
  })

  describe('POST /invites/:token/register', () => {
    it('should register a new member with valid invite', async () => {
      const intent = await createTestIntent({
        status: 'APPROVED',
        email: 'approved@test.com'
      })
      const invite = await createTestInvite(intent.id, {
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const response = await app.inject({
        method: 'POST',
        url: `/api/invites/${invite.token}/register`,
        payload: {
          name: 'New Member',
          email: 'approved@test.com',
          phone: '+5511999999999',
          password: 'SecurePass123',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.member).toHaveProperty('id')
      expect(body.member.name).toBe('New Member')
      expect(body.member.email).toBe('approved@test.com')
      expect(body.member.role).toBe('MEMBER')
      expect(body.member.status).toBe('ACTIVE')
      expect(body.member).not.toHaveProperty('password')
    })

    it('should return 400 when name is missing', async () => {
      const intent = await createTestIntent({ status: 'APPROVED' })
      const invite = await createTestInvite(intent.id)

      const response = await app.inject({
        method: 'POST',
        url: `/api/invites/${invite.token}/register`,
        payload: {
          email: 'test@example.com',
          password: 'SecurePass123',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when email is missing', async () => {
      const intent = await createTestIntent({ status: 'APPROVED' })
      const invite = await createTestInvite(intent.id)

      const response = await app.inject({
        method: 'POST',
        url: `/api/invites/${invite.token}/register`,
        payload: {
          name: 'Test User',
          password: 'SecurePass123',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when password is missing', async () => {
      const intent = await createTestIntent({ status: 'APPROVED' })
      const invite = await createTestInvite(intent.id)

      const response = await app.inject({
        method: 'POST',
        url: `/api/invites/${invite.token}/register`,
        payload: {
          name: 'Test User',
          email: 'test@example.com',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when password is too short', async () => {
      const intent = await createTestIntent({ status: 'APPROVED' })
      const invite = await createTestInvite(intent.id)

      const response = await app.inject({
        method: 'POST',
        url: `/api/invites/${invite.token}/register`,
        payload: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'short',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 400 when name is too short', async () => {
      const intent = await createTestIntent({ status: 'APPROVED' })
      const invite = await createTestInvite(intent.id)

      const response = await app.inject({
        method: 'POST',
        url: `/api/invites/${invite.token}/register`,
        payload: {
          name: 'Ab',
          email: 'test@example.com',
          password: 'SecurePass123',
        },
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return 410 for expired invite', async () => {
      const intent = await createTestIntent({ status: 'APPROVED', email: 'test@test.com' })
      const invite = await createTestInvite(intent.id, {
        status: 'EXPIRED',
      })

      const response = await app.inject({
        method: 'POST',
        url: `/api/invites/${invite.token}/register`,
        payload: {
          name: 'Test User',
          email: 'test@test.com',
          password: 'SecurePass123',
        },
      })

      expect(response.statusCode).toBe(410)
    })

    it('should return 410 for already used invite', async () => {
      const intent = await createTestIntent({ status: 'APPROVED', email: 'test@test.com' })
      const invite = await createTestInvite(intent.id, {
        status: 'USED',
      })

      const response = await app.inject({
        method: 'POST',
        url: `/api/invites/${invite.token}/register`,
        payload: {
          name: 'Test User',
          email: 'test@test.com',
          password: 'SecurePass123',
        },
      })

      expect(response.statusCode).toBe(410)
    })

    it('should mark invite as USED after successful registration', async () => {
      const intent = await createTestIntent({ status: 'APPROVED', email: 'test@test.com' })
      const invite = await createTestInvite(intent.id, {
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const response = await app.inject({
        method: 'POST',
        url: `/api/invites/${invite.token}/register`,
        payload: {
          name: 'Test User',
          email: 'test@test.com',
          password: 'SecurePass123',
        },
      })

      expect(response.statusCode).toBe(201)

      // Verify invite status was updated
      const updatedInvite = await getInviteById(invite.id)
      expect(updatedInvite?.status).toBe('USED')
    })
  })
})
