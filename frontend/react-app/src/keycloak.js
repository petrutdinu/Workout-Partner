import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'workoutpartner',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'workoutpartner-client'
};

const keycloak = new Keycloak(keycloakConfig);

export const initKeycloak = async () => {
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
      checkLoginIframe: false
    });
    return authenticated;
  } catch (error) {
    console.error('Keycloak initialization failed:', error);
    return false;
  }
};

export const getToken = () => keycloak.token;

export const isAuthenticated = () => !!keycloak.authenticated;

export const getUserInfo = () => {
  if (!keycloak.tokenParsed) return null;

  const token = keycloak.tokenParsed;
  const roles = token.realm_access?.roles || [];

  return {
    id: token.sub,
    username: token.preferred_username,
    email: token.email,
    firstName: token.given_name,
    lastName: token.family_name,
    roles: roles,
    isAdmin: roles.includes('Admin'),
    isTrainer: roles.includes('Trainer'),
    isAthlete: roles.includes('Athlete')
  };
};

export const login = () => keycloak.login();

export const logout = () => keycloak.logout({ redirectUri: window.location.origin });

export const updateToken = async () => {
  try {
    await keycloak.updateToken(30);
    return keycloak.token;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    login();
    throw error;
  }
};

export default keycloak;
