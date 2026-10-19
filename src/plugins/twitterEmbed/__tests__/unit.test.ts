import { describe, it, expect } from 'vitest'
import { hasTwitterEmbed } from '@/plugins/twitterEmbed/hasTwitterEmbed'

const htmlBlock = (code: string, renderAsHtml = true) => ({
  type: 'block',
  fields: { blockType: 'code-block', renderAsHtml, code },
})
const doc = (...children: object[]) => ({ root: { type: 'root', children } })

const tweet = '<blockquote class="twitter-tweet"><p>HTML is the new markdown.</p></blockquote>'

describe('hasTwitterEmbed', () => {
  it('finds an X embed in a raw-HTML block, also when nested', () => {
    expect(hasTwitterEmbed(doc(htmlBlock(tweet)))).toBe(true)
    expect(hasTwitterEmbed(doc({ type: 'list', children: [htmlBlock(tweet)] }))).toBe(true)
  })

  it('ignores code shown as a sample and other HTML', () => {
    expect(hasTwitterEmbed(doc(htmlBlock(tweet, false)))).toBe(false)
    expect(hasTwitterEmbed(doc(htmlBlock('<blockquote class="quote">x</blockquote>')))).toBe(false)
    expect(hasTwitterEmbed(doc({ type: 'paragraph', children: [{ type: 'text', text: 'twitter-tweet' }] }))).toBe(false)
  })

  it('handles empty content', () => {
    expect(hasTwitterEmbed(null)).toBe(false)
    expect(hasTwitterEmbed({})).toBe(false)
  })
})
