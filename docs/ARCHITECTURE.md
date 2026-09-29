# Architecture & System Design

High-level architecture documentation for the Emporium Capitals application.

---

## 1. System Topology

```mermaid
graph TD
    Client["Desktop & Mobile Web Clients"] --> Ingress["Reverse Proxy (Nginx / Cloudflare / Apache .htaccess)"]
    Ingress --> App["Next.js 16 Application Server (Port 3000)"]
    
    subgraph Frontend ["Frontend Tier (App Router + React 19)"]
        Landing["Marketing Pages & FAQs"]
        Terminal["Live Trading Terminal (/trading)"]
        Swap["Instant Swap Desk (/swap)"]
        UserDash["User Dashboard & Portfolios"]
        AdminDesk["Admin Operations Center (/admin)"]
    end

    subgraph Backend ["Backend Tier (API Routes & Workers)"]
        AuthSvc["Auth Service (JWT / jose + bcryptjs)"]
        TradeSvc["Trading Engine (Atomic Settle)"]
        PriceEngine["Crypto Price Engine (Binance Vision CDN)"]
        Lifecycle["Cron & Lifecycle Engine"]
        EmailSvc["Email Dispatcher (Nodemailer)"]
    end

    subgraph Data ["Data & External Services"]
        NeonDB["PostgreSQL (Neon Serverless)"]
        MySQLDB["MySQL / MariaDB (cPanel Shared)"]
        BinanceCDN["Binance Vision Public CDN Mirror"]
        TradingView["TradingView Advanced Charts"]
        SMTP["SMTP Mail Server"]
    end

    App --> Frontend
    App --> Backend
    TradeSvc --> PriceEngine
    PriceEngine --> BinanceCDN
    Backend --> NeonDB
    Backend --> MySQLDB
    Backend --> SMTP
```

---

## 2. Security & Session Model

1. **Authentication Token Storage**:
   - `user_token`: Encrypted/Signed JWT stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
   - `admin_token`: Separate admin credential cookie, strictly scoped to `/api/admin/*` and `/admin/*`.
2. **Reverse Proxy Header Normalization (`proxy.js`)**:
   - Resolves `x-forwarded-proto` and `x-forwarded-host` to prevent mixed-content `http://` security warnings on modern SSL deployments.
3. **Idempotency Guard**:
   - Trading orders require or automatically generate an `idempotencyKey` preventing accidental double-order submissions.
4. **Balance Lock**:
   - Trades and withdrawals execute atomic SQL updates (`UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING ...`) eliminating race conditions.
