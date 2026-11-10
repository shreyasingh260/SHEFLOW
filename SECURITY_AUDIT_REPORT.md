# SheFlow Application & OWASP Security Audit Report

**Date:** November 9, 2026  
**Auditor:** Application Security Specialist & Penetration Tester  
**Standard:** OWASP Top 10 (2021) & OWASP API Security Top 10 (2023)  
**Target Application:** SheFlow Spring Boot 3 API & React Client

---

## 1. Executive Summary

This security audit evaluated the SheFlow backend across authentication, authorization, cryptographic storage, input validation, session management, and OWASP Top 10 vulnerability categories.

### Findings Breakdown
- **Critical Risk:** 2
- **High Risk:** 3
- **Medium Risk:** 4
- **Low / Informational:** 3

---

## 2. OWASP Top 10 Evaluation Matrix

| OWASP Vulnerability | Status | Finding / Detail |
|:---|:---:|:---|
| **A01: Broken Access Control** | ❌ **FAIL** | 1) `/api/v1/auth/reset-password` allows resetting any user's password without verification token.<br>2) Tracking & cycle endpoints fall back to `"shreya@example.com"` when unauthenticated. |
| **A02: Cryptographic Failures** | ⚠️ **PARTIAL** | Passwords hashed with BCrypt (good). JWT secret is hardcoded in properties file and Git repository. Refresh token is mock unverified timestamp string. |
| **A03: Injection (SQLi / XSS)** | ✅ **PASS** | Spring Data JPA parameterized queries prevent SQL injection. Input fields validated using Bean Validation (`@NotBlank`, `@Email`, regex). |
| **A04: Insecure Design** | ❌ **FAIL** | No inventory concurrency control or idempotency keys for checkout. Brute-force attacks on `/login` are uninhibited. |
| **A05: Security Misconfiguration** | ❌ **FAIL** | CORS permits wildcard origin `*` alongside `allowCredentials(true)`. Missing security headers (HSTS, Content-Security-Policy). Default Hikari connection limits. |
| **A06: Vulnerable / Outdated Components** | ✅ **PASS** | Using modern Spring Boot 3.2.5, JJWT 0.12.5, MySQL Connector 8.3.0. |
| **A07: Identification & Auth Failures** | ❌ **FAIL** | Password reset OTP flow is disconnected from password reset endpoint. No login attempt throttling. |
| **A08: Software & Data Integrity Failures** | ⚠️ **PARTIAL** | Unsigned / unverified refresh tokens in `/auth/refresh`. Lack of payment webhook signature verification. |
| **A09: Security Logging & Monitoring** | ⚠️ **PARTIAL** | Security exceptions swallowed in `JwtFilter` using `catch (Exception ignored) {}`. No audit trail for failed login attempts. |
| **A10: Server-Side Request Forgery (SSRF)** | ✅ **PASS** | No arbitrary external URL fetching in backend services. |

---

## 3. Deep-Dive Findings & Technical Evidence

### SEC-01: Insecure Password Reset (Account Takeover)
- **Vulnerability Type:** Broken Object-Level Authorization / Authentication Bypass (CWE-640)
- **Severity:** **CRITICAL**
- **Vulnerable Code:**
  ```java
  // AuthController.java
  @PostMapping("/reset-password")
  public ResponseEntity<ApiResponse> resetPassword(@RequestBody Map<String, String> body) {
      String email = body.get("email");
      String newPassword = body.get("newPassword");
      authService.resetPassword(email, newPassword);
      return ResponseEntity.ok(new ApiResponse("Password reset successfully"));
  }
  ```
- **Exploit Scenario:** An attacker observes or guesses a victim's email (`ceo@company.com`) and sends a `POST` request to `/api/v1/auth/reset-password` with `{"email":"ceo@company.com","newPassword":"HackedPassword123!"}`. The user's password is immediately overwritten in MySQL without any OTP verification.
- **Remediation:**
  1. `/forgot-password` generates a random 6-digit OTP stored with a 10-minute expiry and hashed in database or in-memory cache.
  2. `/verify-otp` validates the OTP and issues a single-use cryptographically signed JWT `resetToken` (valid for 5 minutes).
  3. `/reset-password` requires `{ "resetToken": "...", "newPassword": "..." }`, validates the token signature and subject, and invalidates the token upon use.

### SEC-02: Hardcoded Fallback User in Sensitive Endpoints
- **Vulnerability Type:** Broken Authorization / Data Leakage (CWE-200)
- **Severity:** **CRITICAL**
- **Vulnerable Code:**
  ```java
  // TrackingController.java & CycleController.java
  String email = auth != null ? auth.getName() : "shreya@example.com";
  ```
- **Exploit Scenario:** Any network proxy or routing glitch where `auth` is null results in the endpoint mutating or reading `"shreya@example.com"`'s private cycle and health history.
- **Remediation:** Remove default email fallbacks. Enforce strict check:
  ```java
  if (auth == null || !auth.isAuthenticated()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
  }
  ```

### SEC-03: Permissive CORS with Wildcard and Credentials
- **Vulnerability Type:** Security Misconfiguration (CWE-942)
- **Severity:** **HIGH**
- **Vulnerable Code:**
  ```java
  // CorsConfig.java
  config.setAllowCredentials(true);
  config.setAllowedOriginPatterns(List.of("*"));
  ```
- **Exploit Scenario:** A malicious website can trigger authenticated cross-origin XMLHttpRequests/fetch requests on behalf of an authenticated SheFlow user.
- **Remediation:** Explicitly parse `app.cors.allowed-origins` from `application.properties` and restrict allowed origins to trusted client URLs.

### SEC-04: Non-Functional Refresh Token Endpoint & Lack of Rotation
- **Vulnerability Type:** Authentication Bypass / Token Mismanagement (CWE-287)
- **Severity:** **HIGH**
- **Vulnerable Code:**
  ```java
  // AuthController.java
  @PostMapping("/refresh")
  public ResponseEntity<Map<String, String>> refresh(@RequestBody Map<String, String> body) {
      return ResponseEntity.ok(Map.of(
          "accessToken", "refreshed_access_token_" + System.currentTimeMillis()
      ));
  }
  ```
- **Remediation:** Parse the `refreshToken` parameter, verify cryptographic signature and expiration via `JwtUtil`, check against a token blacklist/version in the database, and issue a new pair of access and refresh tokens.

---

## 4. Remediation Verification Checklist

- [ ] Cryptographic password reset token flow implemented and tested.
- [ ] Hardcoded user email fallbacks removed from all controllers.
- [ ] Strict CORS origin matching enforced from configuration.
- [ ] Genuine refresh token validation & rotation implemented.
- [ ] Rate limiting filter added to `/api/v1/auth/**` endpoints.
- [ ] Security exceptions properly logged with audit details.
