export class NotFoundError extends Error {
  override name = 'NotFoundError';
  constructor(message: string) {
    super(message);
  }
}

export class ConflictError extends Error {
  override name = 'ConflictError';
  constructor(message: string) {
    super(message);
  }
}
