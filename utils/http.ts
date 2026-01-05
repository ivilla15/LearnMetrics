export function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message: string | object, status = 400) {
  return jsonResponse(typeof message === 'string' ? { error: message } : message, status);
}
