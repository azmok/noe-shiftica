async function checkHtml() {
  const res = await fetch('https://noe-shiftica.com/blog');
  const html = await res.text();
  console.log("Does it contain 'test'? ", html.includes('test'));
  console.log("Does it contain 'テスト'? ", html.includes('テスト'));
  console.log("Does it contain 'asset-type-thinking-skill-assets-life-boost'? ", html.includes('asset-type-thinking-skill-assets-life-boost'));
}
checkHtml();
