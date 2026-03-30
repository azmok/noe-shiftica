import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures mockSend is accessible inside the vi.mock factory (which is hoisted above imports)
const mockSend = vi.hoisted(() => vi.fn())

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend }
  },
}))

import { POST } from '@/app/api/contact/route'

const makeRequest = (body: unknown) =>
  new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.clearAllMocks()
  mockSend.mockResolvedValue({ data: { id: 'email-id-123' }, error: null })
})

describe('POST /api/contact — validation', () => {
  it('returns 400 when name is missing', async () => {
    const res = await POST(
      makeRequest({ email: 'test@example.com', message: 'Hello' })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('必要項目')
  })

  it('returns 400 when email is missing', async () => {
    const res = await POST(
      makeRequest({ name: 'Azuma', message: 'Hello' })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('必要項目')
  })

  it('returns 400 when message is missing', async () => {
    const res = await POST(
      makeRequest({ name: 'Azuma', email: 'test@example.com' })
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('必要項目')
  })

  it('returns 400 when all required fields are empty strings', async () => {
    const res = await POST(
      makeRequest({ name: '', email: '', message: '' })
    )
    expect(res.status).toBe(400)
  })
})

describe('POST /api/contact — successful submission', () => {
  it('returns 200 with success:true when all required fields are present', async () => {
    const res = await POST(
      makeRequest({
        name: 'Azuma',
        email: 'azuma@example.com',
        message: 'I want a website',
        budget: '50万円',
        timeline: '3ヶ月',
      })
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('sends two emails: one to customer, one to admin', async () => {
    await POST(
      makeRequest({
        name: 'Azuma',
        email: 'azuma@example.com',
        message: 'I want a website',
      })
    )
    expect(mockSend).toHaveBeenCalledTimes(2)
  })

  it('sends customer email to the submitted address', async () => {
    await POST(
      makeRequest({
        name: 'Azuma',
        email: 'azuma@example.com',
        message: 'I want a website',
      })
    )
    const firstCall = mockSend.mock.calls[0][0]
    expect(firstCall.to).toContain('azuma@example.com')
    expect(firstCall.subject).toContain('お問い合わせを受け付けました')
  })
})

describe('POST /api/contact — Resend error handling', () => {
  it('returns 500 when customer email send fails', async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Send failed' },
    })

    const res = await POST(
      makeRequest({
        name: 'Azuma',
        email: 'azuma@example.com',
        message: 'Hello',
      })
    )
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('自動返信メール')
  })

  it('returns 500 when admin email send fails', async () => {
    // First call (customer) succeeds, second call (admin) fails
    mockSend
      .mockResolvedValueOnce({ data: { id: 'c-id' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Admin fail' } })

    const res = await POST(
      makeRequest({
        name: 'Azuma',
        email: 'azuma@example.com',
        message: 'Hello',
      })
    )
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toContain('管理者宛')
  })
})
