export async function GET() {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/users", { cache: "no-store" });
    if (!res.ok) {
      return Response.json({ ok: false, error: `Upstream ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    return Response.json(data, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
