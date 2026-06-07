CREATE TABLE IF NOT EXISTS certificate_applications (
  id                   SERIAL PRIMARY KEY,
  applicant_address    VARCHAR(42) NOT NULL,
  name                 VARCHAR(255) NOT NULL,
  institution          VARCHAR(255),
  course_name          VARCHAR(255),
  description          TEXT,
  file_url             VARCHAR(500),
  status               VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  authenticator_address VARCHAR(42),
  cert_id              VARCHAR(255),
  tx_hash              VARCHAR(66),
  reject_reason        TEXT,
  reviewed_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_applicant ON certificate_applications(applicant_address);
CREATE INDEX IF NOT EXISTS idx_app_status    ON certificate_applications(status);
