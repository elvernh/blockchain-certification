-- Temporary nonces for wallet sign-in challenges
CREATE TABLE IF NOT EXISTS auth_nonces (
  address    VARCHAR(42) PRIMARY KEY,
  nonce      VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Off-chain metadata that supplements on-chain certificate data
CREATE TABLE IF NOT EXISTS certificate_metadata (
  id              SERIAL PRIMARY KEY,
  cert_id         VARCHAR(66) UNIQUE NOT NULL,  -- bytes32 hex (0x + 64 chars)
  holder_address  VARCHAR(42) NOT NULL,
  issuer_address  VARCHAR(42) NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  institution     VARCHAR(255),
  course_name     VARCHAR(255),
  file_url        VARCHAR(500),                 -- uploaded certificate document path
  tx_hash         VARCHAR(66),                  -- on-chain transaction hash
  issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  status          VARCHAR(20) NOT NULL DEFAULT 'VALID',
  revoke_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_holder  ON certificate_metadata(holder_address);
CREATE INDEX IF NOT EXISTS idx_cert_issuer  ON certificate_metadata(issuer_address);
CREATE INDEX IF NOT EXISTS idx_cert_status  ON certificate_metadata(status);
