import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import prismaPlugin from '@/plugins/prisma'
import { intentRoutes } from '@/http/routes/public/intent-routes'
import { inviteRoutes } from '@/http/routes/public/invite-routes'
import { adminIntentRoutes } from '@/http/routes/admin/intent-routes'

export const prisma = new PrismaClient()

export async function createTestApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false, // Disable logging in tests
  })

  // Register plugins
  await app.register(cors, {
    origin: '*',
  })

  await app.register(prismaPlugin)

  // Register routes
  await app.register(intentRoutes, { prefix: '/api' })
  await app.register(inviteRoutes, { prefix: '/api' })
  await app.register(adminIntentRoutes, { prefix: '/api/admin' })

  // Error handler
  app.setErrorHandler((error, _request, reply) => {
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.validation,
        },
      })
    }

    return reply.status(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      },
    })
  })

  await app.ready()
  return app
}

export async function cleanDatabase() {
  await prisma.invite.deleteMany()
  await prisma.intent.deleteMany()
  await prisma.member.deleteMany()
}

export async function createTestMember(data?: {
  name?: string
  email?: string
  phone?: string
  password?: string
  role?: 'ADMIN' | 'MEMBER'
  status?: 'ACTIVE' | 'INACTIVE'
}) {
  return await prisma.member.create({
    data: {
      name: data?.name ?? 'Test User',
      email: data?.email ?? `test-${Date.now()}@example.com`,
      phone: data?.phone ?? '+5511999999999',
      password: data?.password ?? 'hashed_password',
      role: data?.role ?? 'MEMBER',
      status: data?.status ?? 'ACTIVE',
    },
  })
}

export async function createTestIntent(data?: {
  fullName?: string
  email?: string
  phone?: string
  notes?: string
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedBy?: string | null
}) {
  return await prisma.intent.create({
    data: {
      fullName: data?.fullName ?? 'Test Intent',
      email: data?.email ?? `intent-${Date.now()}@example.com`,
      phone: data?.phone ?? '+5511988888888',
      notes: data?.notes ?? 'Test notes',
      status: data?.status ?? 'PENDING',
      reviewedBy: data?.reviewedBy ?? null,
      reviewedAt: data?.status && data.status !== 'PENDING' ? new Date() : null,
    },
  })
}

export async function createTestInvite(intentId: string, data?: {
  token?: string
  expiresAt?: Date
  status?: 'PENDING' | 'USED' | 'EXPIRED'
}) {
  return await prisma.invite.create({
    data: {
      intentId,
      token: data?.token ?? `test-token-${Date.now()}`,
      expiresAt: data?.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: data?.status ?? 'PENDING',
    },
  })
}

export async function getInviteById(id: string) {
  return await prisma.invite.findUnique({
    where: { id },
  })
}
