import fs from 'fs';

async function test() {
    const fileContent = fs.readFileSync('C:/Users/genta/My Drive/__noe-shiftica/_posts/ai_code_vs_human_code_no_hr.md', 'utf-8');

    const res = await fetch('http://localhost:3000/api/convert-markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: fileContent
    });

    if (!res.ok) {
        console.error('FAILED', res.status, await res.text());
        return;
    }

    const data = await res.json();
    console.log(JSON.stringify(data.lexical, null, 2));
}

test();
