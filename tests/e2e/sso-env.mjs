// Backend configuration still requires these fields. Search is intercepted by
// Playwright; port 1 makes accidental backend directory calls fail locally.
export const mockSsoEnvironment = {
  BCGOV_SSO_API_CLIENT_ID: 'e2e-unused',
  BCGOV_SSO_API_CLIENT_SECRET: 'e2e-unused',
  BCGOV_SSO_API_URL: 'http://127.0.0.1:1/idir/users',
  BCGOV_SSO_API_URL_BCEID: 'http://127.0.0.1:1/bceid/users',
  BCGOV_TOKEN_URL: 'http://127.0.0.1:1/token',
}
