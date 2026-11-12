const failure = (status, message, headers = {}) => new Response(message, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", ...headers },
});

export default {
  async fetch(request, env) {
    if (!["GET", "HEAD"].includes(request.method))
      return failure(405, "Method Not Allowed", { Allow: "GET, HEAD" });
    const key = new URL(request.url).pathname.slice(1);
    if (!/^media\/[a-f0-9]{24}$/.test(key)) return failure(404, "Not Found");
    try {
      const object = await env.MEDIA.head(key);
      if (!object) return failure(404, "Not Found");
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("ETag", object.httpEtag);
      headers.set("Last-Modified", object.uploaded.toUTCString());
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("Content-Disposition", "inline");
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Accept-Ranges", "bytes");
      const noneMatch = request.headers.get("If-None-Match");
      if (noneMatch?.split(",").some(value => value.trim() === "*" || value.trim().replace(/^W\//, "") === object.httpEtag))
        return new Response(null, { status: 304, headers });
      let range;
      const requested = request.method === "GET" && request.headers.get("Range");
      const ifRange = request.headers.get("If-Range");
      if (requested && (!ifRange || ifRange === object.httpEtag || ifRange === object.uploaded.toUTCString())) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(requested);
        let start = NaN, end = NaN;
        if (match && (match[1] || match[2])) {
          start = match[1] ? Number(match[1]) : Math.max(0, object.size - Number(match[2]));
          end = match[1] && match[2] ? Math.min(Number(match[2]), object.size - 1) : object.size - 1;
        }
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= object.size)
          return failure(416, "Range Not Satisfiable", { "Content-Range": `bytes */${object.size}` });
        range = { offset: start, length: end - start + 1 };
        headers.set("Content-Range", `bytes ${start}-${end}/${object.size}`);
      }
      headers.set("Content-Length", String(range?.length ?? object.size));
      if (request.method === "HEAD") return new Response(null, { headers });
      const data = await env.MEDIA.get(key, { range });
      if (!data) return failure(404, "Not Found");
      return new Response(data.body, { status: range ? 206 : 200, headers });
    } catch {
      return failure(503, "Media temporarily unavailable");
    }
  },
};
