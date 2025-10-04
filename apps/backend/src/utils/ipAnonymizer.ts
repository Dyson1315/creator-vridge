import { Request } from 'express';
import crypto from 'crypto';

/**
 * Comprehensive IP address anonymization utility
 * Supports IPv4, IPv6, and handles proxy headers securely
 */
export class IPAnonymizer {
  private static readonly HASH_ALGORITHM = 'sha256';
  private static readonly SALT = process.env.IP_ANONYMIZATION_SALT || 'creator-vridge-default-salt-2024';
  
  /**
   * Extract client IP considering various proxy headers
   */
  static getClientIP(req: Request): string {
    // Order of precedence for IP extraction
    const ipSources = [
      req.get('x-forwarded-for')?.split(',')[0]?.trim(),
      req.get('x-real-ip'),
      req.get('x-client-ip'),
      req.get('cf-connecting-ip'), // Cloudflare
      req.connection?.remoteAddress,
      req.socket?.remoteAddress,
      req.ip
    ];
    
    for (const ip of ipSources) {
      if (ip && this.isValidIP(ip)) {
        return ip;
      }
    }
    
    return 'unknown';
  }
  
  /**
   * Validate IP address format (IPv4 or IPv6)
   */
  private static isValidIP(ip: string): boolean {
    // IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.').map(Number);
      return parts.every(part => part >= 0 && part <= 255);
    }
    
    // IPv6 validation (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    return ipv6Regex.test(ip);
  }
  
  /**
   * Anonymize IPv4 address by masking last octet
   */
  private static anonymizeIPv4(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    return ip;
  }
  
  /**
   * Anonymize IPv6 address by masking last 64 bits
   */
  private static anonymizeIPv6(ip: string): string {
    // Remove IPv6 prefix if present
    const cleanIP = ip.replace(/^::ffff:/, '');
    
    // Check if it's actually IPv4 mapped in IPv6
    if (cleanIP !== ip) {
      return this.anonymizeIPv4(cleanIP);
    }
    
    // For pure IPv6, mask the last 64 bits (interface identifier)
    const parts = ip.split(':');
    if (parts.length >= 4) {
      // Keep first 4 groups (64 bits), zero out the rest
      const networkPart = parts.slice(0, 4).join(':');
      return `${networkPart}::`;
    }
    
    return ip;
  }
  
  /**
   * Anonymize IP address based on type
   */
  static anonymizeIP(ip: string): string {
    if (!ip || ip === 'unknown') {
      return 'unknown';
    }
    
    // Remove any port numbers
    const cleanIP = ip.split(':')[0];
    
    if (cleanIP.includes('.')) {
      return this.anonymizeIPv4(cleanIP);
    } else if (cleanIP.includes(':')) {
      return this.anonymizeIPv6(cleanIP);
    }
    
    return 'unknown';
  }
  
  /**
   * Create a hashed anonymized IP for analytics while preserving uniqueness
   * Useful for tracking unique users without storing actual IPs
   */
  static hashIP(ip: string): string {
    if (!ip || ip === 'unknown') {
      return 'unknown';
    }
    
    // First anonymize, then hash to ensure privacy
    const anonymizedIP = this.anonymizeIP(ip);
    const hash = crypto.createHash(this.HASH_ALGORITHM);
    hash.update(anonymizedIP + this.SALT);
    return hash.digest('hex').substring(0, 16); // First 16 chars for shorter storage
  }
  
  /**
   * Get anonymized IP from request with enhanced privacy protection
   */
  static getAnonymizedIP(req: Request, useHash = false): string {
    const clientIP = this.getClientIP(req);
    
    if (useHash) {
      return this.hashIP(clientIP);
    }
    
    return this.anonymizeIP(clientIP);
  }
  
  /**
   * Check if IP is from private/internal network
   */
  static isPrivateIP(ip: string): boolean {
    if (!ip || ip === 'unknown') {
      return false;
    }
    
    // IPv4 private ranges
    const privateRanges = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^127\./,                   // 127.0.0.0/8 (loopback)
      /^169\.254\./,              // 169.254.0.0/16 (link-local)
    ];
    
    return privateRanges.some(range => range.test(ip));
  }
  
  /**
   * Enhanced privacy mode: returns generic identifiers for internal/development use
   */
  static getPrivacyEnhancedIdentifier(req: Request): string {
    const clientIP = this.getClientIP(req);
    
    if (this.isPrivateIP(clientIP)) {
      return 'internal';
    }
    
    // For external IPs, return a hashed identifier
    return this.hashIP(clientIP);
  }
}

// Environment configuration validation
if (process.env.NODE_ENV === 'production' && !process.env.IP_ANONYMIZATION_SALT) {
  console.warn('⚠️  IP_ANONYMIZATION_SALT not set in production. Using default salt (less secure).');
}