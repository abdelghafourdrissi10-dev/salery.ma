import crypto from 'crypto';

/**
 * TokenService
 * Handles generation and hashing of secure invitation tokens.
 */
export class TokenService {
    /**
     * Generates a 32-byte secure random token.
     * @returns {string} The raw token as a hex string.
     */
    static generateRawToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Hashes a raw token for secure database storage.
     * @param rawToken {string} The raw hex token.
     * @returns {string} The SHA-256 hash.
     */
    static hashToken(rawToken: string): string {
        return crypto
            .createHash('sha256')
            .update(rawToken)
            .digest('hex');
    }

    /**
     * Verifies if a raw token matches a stored hash.
     * @param rawToken {string}
     * @param hashedToken {string}
     * @returns {boolean}
     */
    static verifyToken(rawToken: string, hashedToken: string): boolean {
        const hash = this.hashToken(rawToken);
        return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashedToken));
    }
}
