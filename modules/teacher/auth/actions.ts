import { getApiErrorMessage } from '@/utils/http';

export async function teacherLogin(input: { email: string; password: string }) {
  const res = await fetch('/api/teacher/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(getApiErrorMessage(json, 'Login failed'));
  return json;
}

export async function teacherSignup(input: { name: string; email: string; password: string }) {
  const res = await fetch('/api/teacher/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(getApiErrorMessage(json, 'Signup failed'));
  return json;
}

export async function teacherLogout() {
  const res = await fetch('/api/teacher/logout', { method: 'POST' });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(getApiErrorMessage(json, 'Logout failed'));
  }
}
