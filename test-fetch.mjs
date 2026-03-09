async function test() {
    const res = await fetch('http://localhost:3000/api/posts?limit=1');
    if (!res.ok) {
        console.error('FAILED', res.status, await res.text());
        return;
    }
    const data = await res.json();
    if (data.docs && data.docs.length > 0) {
        console.log(JSON.stringify(data.docs[0].content, null, 2));
    } else {
        console.log('No posts found');
    }
}
test();
