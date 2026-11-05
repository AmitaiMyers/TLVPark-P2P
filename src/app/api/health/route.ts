/** Render health check target. Lives under /api so the locale proxy skips it. */
export function GET() {
  return Response.json({ status: "ok" });
}
