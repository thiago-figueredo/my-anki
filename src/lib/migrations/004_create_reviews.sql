CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  
  -- SRS Snapshot
  interval INTEGER NOT NULL,
  ease_factor REAL NOT NULL,
  repetitions INTEGER NOT NULL,
  
  -- User Data
  user_response TEXT,
  
  -- AI Evaluation (Optimized Columns)
  ai_score INTEGER,
  ai_is_correct BOOLEAN,
  ai_feedback_summary TEXT,
  ai_metadata TEXT, -- JSON blob for correctPoints, missingPoints, improvementTips
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_card_id ON reviews(card_id);
