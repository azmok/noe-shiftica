import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { messages, model = 'gpt-4o' } = await request.json()

        const githubToken = process.env.GITHUB_TOKEN

        if (!githubToken) {
            return NextResponse.json(
                { error: 'GITHUB_TOKEN not configured' },
                { status: 500 }
            )
        }

        const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${githubToken}`,
            },
            body: JSON.stringify({
                messages,
                model,
                temperature: 0.7,
                max_tokens: 4096,
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[GITHUB-MODELS] Error response:', response.status, errorText)
            return NextResponse.json(
                { error: `GitHub Models API error: ${response.status}`, details: errorText },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('[GITHUB-MODELS] Request failed:', error)
        return NextResponse.json(
            { error: 'Failed to call GitHub Models' },
            { status: 500 }
        )
    }
}
