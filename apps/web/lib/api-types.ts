// Mirrors social-feed-api/src/common/types/api-response.types.ts.
// Kept in sync by hand for now; later this could be generated from an OpenAPI
// schema. The shapes are intentionally narrow so unwrapping is trivial.

export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'UNPROCESSABLE_ENTITY'
  | 'TOO_MANY_REQUESTS'
  | 'INVALID_REFERENCE'
  | 'DATABASE_ERROR'
  | 'INTERNAL_SERVER_ERROR';

export interface ApiSuccess<TData> {
  success: true;
  timestamp: string;
  data: TData;
  meta?: unknown;
}

export interface ApiError {
  success: false;
  timestamp: string;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: string[];
  };
}
