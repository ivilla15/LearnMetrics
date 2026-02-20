export type RouteContext<P extends Record<string, string>> = {
  params: Promise<P>;
};
