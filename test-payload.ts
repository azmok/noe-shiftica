import { getPayload } from "payload";
import configPromise from "./src/payload.config.ts";

async function run() {
  const payload = await getPayload({ config: configPromise });
  const posts = await payload.find({
    collection: "posts",
    where: { _status: { equals: 'published' } }
  });
  console.log("Total published posts:", posts.totalDocs);
}
run().catch(console.error);
