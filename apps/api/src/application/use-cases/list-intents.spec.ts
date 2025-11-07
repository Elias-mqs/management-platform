import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ListIntentsUseCase } from './list-intents'
import type { IntentRepository } from '@/application/ports/intent-repository'
import type { Intent } from '@/domain/entities/intent'

describe('ListIntentsUseCase', () => {
  let sut: ListIntentsUseCase
  let intentRepository: IntentRepository

  beforeEach(() => {
    intentRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      list: vi.fn(),
      updateStatus: vi.fn(),
    } as unknown as IntentRepository

    sut = new ListIntentsUseCase(intentRepository)
  })

  describe('Filtering', () => {
    it('should list all intents when no filter provided', async () => {
      const mockIntents: Intent[] = [
        {
          id: '1',
          fullName: 'John Doe',
          email: 'john@example.com',
          status: 'PENDING',
          createdAt: new Date(),
        } as Intent,
        {
          id: '2',
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          status: 'APPROVED',
          createdAt: new Date(),
        } as Intent,
      ]

      vi.mocked(intentRepository.list).mockResolvedValue({
        items: mockIntents,
        total: 2,
      })

      const result = await sut.execute({})

      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(intentRepository.list).toHaveBeenCalledWith({
        status: undefined,
        page: 1,
        pageSize: 20,
      })
    })

    it('should filter by PENDING status', async () => {
      const mockIntents: Intent[] = [
        {
          id: '1',
          fullName: 'John Doe',
          email: 'john@example.com',
          status: 'PENDING',
          createdAt: new Date(),
        } as Intent,
      ]

      vi.mocked(intentRepository.list).mockResolvedValue({
        items: mockIntents,
        total: 1,
      })

      const result = await sut.execute({ status: 'PENDING' })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].status).toBe('PENDING')
      expect(intentRepository.list).toHaveBeenCalledWith({
        status: 'PENDING',
        page: 1,
        pageSize: 20,
      })
    })

    it('should filter by APPROVED status', async () => {
      const mockIntents: Intent[] = [
        {
          id: '2',
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          status: 'APPROVED',
          createdAt: new Date(),
        } as Intent,
      ]

      vi.mocked(intentRepository.list).mockResolvedValue({
        items: mockIntents,
        total: 1,
      })

      const result = await sut.execute({ status: 'APPROVED' })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].status).toBe('APPROVED')
    })

    it('should filter by REJECTED status', async () => {
      const mockIntents: Intent[] = [
        {
          id: '3',
          fullName: 'Bob Johnson',
          email: 'bob@example.com',
          status: 'REJECTED',
          createdAt: new Date(),
        } as Intent,
      ]

      vi.mocked(intentRepository.list).mockResolvedValue({
        items: mockIntents,
        total: 1,
      })

      const result = await sut.execute({ status: 'REJECTED' })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].status).toBe('REJECTED')
    })
  })

  describe('Pagination', () => {
    it('should paginate results with default page size', async () => {
      vi.mocked(intentRepository.list).mockResolvedValue({
        items: [],
        total: 0,
      })

      const result = await sut.execute({})

      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
      expect(intentRepository.list).toHaveBeenCalledWith({
        status: undefined,
        page: 1,
        pageSize: 20,
      })
    })

    it('should respect custom page size', async () => {
      vi.mocked(intentRepository.list).mockResolvedValue({
        items: [],
        total: 0,
      })

      const result = await sut.execute({ pageSize: 10 })

      expect(result.pageSize).toBe(10)
      expect(intentRepository.list).toHaveBeenCalledWith({
        status: undefined,
        page: 1,
        pageSize: 10,
      })
    })

    it('should return correct page number', async () => {
      vi.mocked(intentRepository.list).mockResolvedValue({
        items: [],
        total: 50,
      })

      const result = await sut.execute({ page: 3, pageSize: 10 })

      expect(result.page).toBe(3)
      expect(result.totalPages).toBe(5) // 50 total / 10 per page
    })
  })

  describe('Total Pages Calculation', () => {
    it('should calculate total pages correctly', async () => {
      vi.mocked(intentRepository.list).mockResolvedValue({
        items: [],
        total: 25,
      })

      const result = await sut.execute({ pageSize: 10 })

      expect(result.totalPages).toBe(3) // Math.ceil(25 / 10)
    })
  })
})
