-- =========================================
-- CIVIC ISSUES TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS civic_issues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid REFERENCES users(id),
    clerk_reporter_id varchar(255),
    reporter_name varchar,
    reporter_phone varchar,
    category varchar NOT NULL DEFAULT 'other'
        CHECK (category IN (
            'road_damage',
            'electricity',
            'drainage',
            'pipe_leakage',
            'garbage',
            'water_supply',
            'streetlight',
            'other'
        )),
    description text,
    photo_urls text[],
    location geometry(Point, 4326),
    address text,
    status varchar NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'resolved')),
    resolved_at timestamp,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_civic_issues_status ON civic_issues(status);
CREATE INDEX IF NOT EXISTS idx_civic_issues_category ON civic_issues(category);
CREATE INDEX IF NOT EXISTS idx_civic_issues_location ON civic_issues USING GIST(location);
