# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of MedhaBangla seriously. If you believe you have found a security vulnerability, please report it to us responsibly.

### How to Report

1. **Email**: Send details to security@medhabangla.edu.bd
2. **GitHub**: Create a private security advisory at https://github.com/your-org/medhabangla/security/advisories
3. **Include**: 
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: We will acknowledge your report within 48 hours
- **Investigation**: Our security team will investigate within 5 business days
- **Resolution**: We will work on a fix within 30 days
- **Disclosure**: We will coordinate disclosure with you

### Responsible Disclosure

We request that you:
- Give us reasonable time to address the issue before public disclosure
- Not exploit the vulnerability beyond what is necessary to demonstrate it
- Keep communication confidential until we've addressed the issue

## Security Measures

### Authentication & Authorization

#### User Authentication
- **Password Security**: 
  - bcrypt hashing with configurable rounds
  - Minimum 8-character passwords
  - Password strength validation
  - Rate limiting on login attempts

- **Session Management**:
  - Secure, HttpOnly cookies
  - Token expiration (30 minutes for access, 7 days for refresh)
  - Automatic logout on inactivity
  - Concurrent session limits

- **Third-Party Auth**:
  - WorkOS OAuth2 integration
  - PKCE (Proof Key for Code Exchange) implementation
  - Secure redirect URI validation

#### Role-Based Access Control (RBAC)
- **Student Role**:
  - Read access to quizzes, books, games
  - Write access to own attempts, notes, profile
  - Limited to class-appropriate content

- **Teacher Role**:
  - Full CRUD access to quizzes
  - Read access to student analytics
  - No access to admin functions

- **Admin Role**:
  - Full system access
  - User management capabilities
  - System configuration access

### Data Protection

#### Encryption
- **Data in Transit**: 
  - TLS 1.3 for all external communications
  - Internal service mesh encryption
  - Certificate pinning for critical services

- **Data at Rest**:
  - AES-256 encryption for sensitive data
  - Database encryption for PII (Personally Identifiable Information)
  - Encrypted backups with key rotation

#### Data Handling
- **PII Protection**:
  - Minimal data collection
  - Automatic data anonymization for analytics
  - GDPR-compliant data deletion
  - Consent management for data processing

- **Input Validation**:
  - Server-side validation for all inputs
  - SQL injection prevention through ORM
  - XSS prevention through output encoding
  - File upload validation and scanning

### API Security

#### Rate Limiting
- **General API**: 1000 requests/hour per IP
- **Auth Endpoints**: 10 requests/hour per IP
- **AI Endpoints**: 100 requests/hour per user
- **Adaptive Throttling**: Increased limits for authenticated users

#### CORS Policy
- **Allowed Origins**: Configurable whitelist
- **Credentials**: Disabled by default
- **Methods**: Restricted to necessary HTTP methods
- **Headers**: Controlled access to custom headers

#### API Keys & Tokens
- **JWT Tokens**: 
  - RS256 signing algorithm
  - Short-lived access tokens (30 minutes)
  - Rotatable refresh tokens
  - Token blacklisting on logout

- **Service Keys**:
  - Role-based service accounts
  - Automatic key rotation
  - Audit logging for key usage

### Infrastructure Security

#### Container Security
- **Base Images**: 
  - Official, minimal base images
  - Regular security scans
  - CVE monitoring and patching

- **Runtime Security**:
  - Non-root user execution
  - ReadOnly root filesystem where possible
  - Resource limits to prevent DoS

#### Network Security
- **Firewall Rules**:
  - Principle of least privilege
  - Internal service isolation
  - Egress filtering for outbound connections

- **Load Balancer**:
  - WAF (Web Application Firewall) integration
  - DDoS protection
  - Geo-blocking capabilities

#### Database Security
- **Connection Security**:
  - SSL/TLS encrypted connections
  - Connection pooling with limits
  - Prepared statements for all queries

- **Access Control**:
  - Principle of least privilege
  - Role-based database users
  - Row-level security for sensitive data

### Frontend Security

#### Client-Side Protection
- **Content Security Policy**:
  - Strict CSP headers
  - Nonce-based script execution
  - Trusted sources only

- **XSS Prevention**:
  - React's built-in XSS protection
  - Sanitization of user-generated content
  - DOMPurify for rich text content

- **Clickjacking Protection**:
  - X-Frame-Options header
  - Content-Security-Policy frame-ancestors directive

#### Storage Security
- **Local Storage**:
  - No sensitive data stored
  - Encrypted storage for offline data
  - Secure session management

- **Service Workers**:
  - Integrity checking for cached assets
  - Secure offline data handling
  - Update validation

### AI & Third-Party Integration Security

#### Google Gemini API
- **API Key Security**:
  - Environment variable storage
  - Key rotation automation
  - Usage monitoring and alerts

- **Prompt Security**:
  - Input sanitization for AI prompts
  - Output validation for AI responses
  - Content filtering for inappropriate material

#### WorkOS Integration
- **OAuth2 Security**:
  - State parameter validation
  - PKCE implementation
  - Secure token exchange

### Monitoring & Incident Response

#### Security Monitoring
- **Log Management**:
  - Centralized logging
  - Real-time alerting for suspicious activity
  - Long-term retention for forensics

- **Intrusion Detection**:
  - Network-based IDS
  - Host-based monitoring
  - Behavioral anomaly detection

#### Incident Response
- **Detection**:
  - Automated threat detection
  - Manual security reviews
  - Third-party security feeds

- **Response**:
  - Incident classification and escalation
  - Containment procedures
  - Forensic analysis and evidence preservation

- **Recovery**:
  - Backup restoration procedures
  - System hardening post-incident
  - Post-mortem analysis and documentation

### Compliance & Auditing

#### Regulatory Compliance
- **GDPR**: 
  - Data subject rights implementation
  - Privacy by design
  - Data processing agreements

- **COPPA**:
  - Age verification for users
  - Parental consent mechanisms
  - Limited data collection for minors

#### Security Audits
- **Internal Audits**:
  - Quarterly security assessments
  - Penetration testing
  - Code review for security issues

- **External Audits**:
  - Annual third-party security audit
  - SOC 2 Type II compliance
  - ISO 27001 certification roadmap

## Best Practices for Contributors

### Code Review Security Checklist
- [ ] Input validation implemented
- [ ] Output encoding applied
- [ ] Authentication/authorization enforced
- [ ] Error handling without information leakage
- [ ] Secure configuration defaults
- [ ] Dependency security checked
- [ ] Logging without sensitive data
- [ ] Cryptographic best practices followed

### Secure Development Practices
1. **Threat Modeling**: Identify potential threats during design
2. **Security Training**: Regular security awareness training
3. **Secure Coding**: Follow OWASP Secure Coding Practices
4. **Dependency Management**: Regular security scanning
5. **Incident Response**: Know how to report security issues

## Contact

For security-related inquiries, contact:
- **Email**: security@medhabangla.edu.bd
- **PGP Key**: Available upon request
- **Response Time**: Within 24 hours for critical issues

We appreciate your help in keeping MedhaBangla secure for all users!