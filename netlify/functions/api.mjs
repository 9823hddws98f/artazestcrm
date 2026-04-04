import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.replace("/api/", "").split("/");
  const storeName = pathParts[0];
  const itemId = pathParts[1];
  const store = getStore({ name: storeName, siteID: context.site.id, token: context.token });
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  try {
    if (req.method === "GET" && !itemId) {
      const { blobs } = await store.list();
      const items = await Promise.all(
        blobs.map(async (b) => {
          const data = await store.get(b.key, { type: "json" });
          return { id: b.key, ...data };
        })
      );
      return new Response(JSON.stringify(items), { status: 200, headers });
    }
    if (req.method === "GET" && itemId) {
      const data = await store.get(itemId, { type: "json" });
      if (!data) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
      return new Response(JSON.stringify({ id: itemId, ...data }), { status: 200, headers });
    }
    if (req.method === "POST") {
      const body = await req.json();
      const id = body.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await store.setJSON(id, body);
      return new Response(JSON.stringify({ id, ...body }), { status: 201, headers });
    }
    if (req.method === "PUT" && itemId) {
      const body = await req.json();
      await store.setJSON(itemId, body);
      return new Response(JSON.stringify({ id: itemId, ...body }), { status: 200, headers });
    }
    if (req.method === "DELETE" && itemId) {
      await store.delete(itemId);
      return new Response(JSON.stringify({ deleted: true }), { status: 200, headers });
    }
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};
export const config = { path: "/api/*" };
