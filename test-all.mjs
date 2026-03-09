import fs from 'fs';

const files = [
    'C:/Users/genta/My Drive/__noe-shiftica/_posts/ai_code_vs_human_code_no_hr.md',
    'C:/Users/genta/My Drive/__noe-shiftica/_posts/why-rich-and-luxurious-websites-have-become-outdated.md',
    'C:/Users/genta/My Drive/__noe-shiftica/_posts/wordpress-is-outdated-modern-web-production.md'
];

async function test() {
    for (const file of files) {
        if (!fs.existsSync(file)) {
            console.error(`File not found: ${file}`);
            continue;
        }
        const fileContent = fs.readFileSync(file, 'utf-8');

        console.log(`\nTesting: ${file}`);
        const res = await fetch('http://localhost:3000/api/convert-markdown', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: fileContent
        });

        if (!res.ok) {
            console.error('FAILED', res.status, await res.text());
            continue;
        }

        const data = await res.json();
        if (data.lexical && data.lexical.root) {
            console.log(`SUCCESS: lexical root has ${data.lexical.root.children.length} children`);
        } else {
            console.log('FAILED: lexical root missing or invalid');
            console.log(data);
        }
    }
}

test();
