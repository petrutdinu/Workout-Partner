import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

const KEYCLOAK_URL = process.env.KEYCLOAK_URL || 'http://keycloak:8080';
const KEYCLOAK_EXTERNAL_URL = process.env.KEYCLOAK_EXTERNAL_URL || 'http://localhost:8080';
const REALM = process.env.KEYCLOAK_REALM || 'workoutpartner';

@Injectable()
export class AuthService {
  private client = jwksClient({
    jwksUri: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`,
    cache: true,
    rateLimit: true,
  });

  async validateToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const getKey = (header: any, cb: any) => {
        this.client.getSigningKey(header.kid, (err, key) => {
          if (err) return cb(err);
          cb(null, key.getPublicKey());
        });
      };
      jwt.verify(token, getKey, {
        algorithms: ['RS256'],
        issuer: `${KEYCLOAK_EXTERNAL_URL}/realms/${REALM}`,
      }, (err, decoded) => {
        if (err) reject(new UnauthorizedException(`Token validation failed: ${err.message}`));
        else resolve(decoded);
      });
    });
  }

  extractUserInfo(claims: any) {
    const realmRoles = claims?.realm_access?.roles || [];
    const clientRoles = claims?.resource_access?.[process.env.KEYCLOAK_CLIENT_ID || 'workoutpartner-client']?.roles || [];
    const roles = [...realmRoles, ...clientRoles];
    let primaryRole = 'Athlete';
    if (roles.includes('Admin') || roles.includes('admin')) primaryRole = 'Admin';
    else if (roles.includes('Trainer') || roles.includes('trainer')) primaryRole = 'Trainer';
    return {
      keycloak_id: claims.sub,
      email: claims.email,
      username: claims.preferred_username,
      first_name: claims.given_name,
      last_name: claims.family_name,
      roles,
      primary_role: primaryRole,
    };
  }
}
