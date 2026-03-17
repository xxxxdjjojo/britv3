ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS language_preferences JSONB DEFAULT '{
    "locale": "en-GB",
    "date_format": "DD/MM/YYYY",
    "currency": "GBP",
    "timezone": "Europe/London"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS accessibility_preferences JSONB DEFAULT '{
    "font_size": "medium",
    "reduced_motion": false,
    "high_contrast": false,
    "dark_mode": "system",
    "screen_reader_hints": true
  }'::jsonb;
