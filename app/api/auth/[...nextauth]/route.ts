// app/api/auth/[...nextauth]/route.ts
import { handlers } from '../../../../auth'; // ← relative path to /auth.ts
export const { GET, POST } = handlers;
