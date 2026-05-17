export {};

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    /** Set by the API client when retrying after a token refresh (one attempt). */
    _retry?: boolean;
  }
}
