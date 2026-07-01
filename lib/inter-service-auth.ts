export function isInterServiceRequest(request: Request): boolean {
  const secret = process.env.INTER_SERVICE_SECRET;
  if (!secret) return false;
  return request.headers.get("x-inter-service-secret") === secret;
}
