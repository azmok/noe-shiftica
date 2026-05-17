import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function manualRevalidate() {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    console.error("No REVALIDATE_SECRET found in .env.local");
    process.exit(1);
  }

  const targetUrl = 'https://noe-shiftica.com/api/revalidate';
  console.log(`Sending revalidate request to ${targetUrl}...`);
  
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret })
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Success! Production cache invalidated.");
      console.log(data);
    } else {
      const errorText = await response.text();
      console.error(`❌ Failed with status ${response.status}`);
      console.error(errorText);
      console.error("\n💡 Hint: Ensure that REVALIDATE_SECRET in .env.local matches the secret deployed on Firebase App Hosting.");
    }
  } catch (error) {
    console.error("Network Error:", error);
  }
}

manualRevalidate();
