interface Window {
  envConfig?: {
    VITE_API_URL?: string;
    VITE_KEYCLOAK_URL?: string;
    VITE_KEYCLOAK_REALM?: string;
    VITE_KEYCLOAK_CLIENT_ID?: string;
    VITE_KEYCLOAK_LOGOUT_URL?: string;
    [key: string]: string | undefined;
  };
}