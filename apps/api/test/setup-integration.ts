import { PrismaClient } from '@prisma/client'
import { beforeAll, afterEach, afterAll } from 'vitest'

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

beforeAll(async () => {
  // Garantir que o banco está limpo antes de começar
  await prisma.invite.deleteMany()
  await prisma.intent.deleteMany()
  await prisma.member.deleteMany()
})

afterEach(async () => {
  // Limpar dados entre testes para isolamento
  await prisma.invite.deleteMany()
  await prisma.intent.deleteMany()
  await prisma.member.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
