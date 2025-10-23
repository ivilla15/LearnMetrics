export async function GET() {
  return Response.json({
    AUTH_URL: process.env.AUTH_URL,
    AUTH_SECRET: process.env.AUTH_SECRET ? '✅ set' : '❌ missing',
    POSTGRES_URL: process.env.POSTGRES_URL ? '✅ set' : '❌ missing',
    NODE_ENV: process.env.NODE_ENV,
  });
}
