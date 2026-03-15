export function friendlyApiError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return '요청 처리 중 오류가 발생했습니다.';
}
