-- Migration 004: Automation settings and work locations

-- Table: work_locations
-- Stores named workplace locations with GPS coordinates for geofencing
CREATE TABLE IF NOT EXISTS work_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius_meters integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table: automation_settings
-- One row per user. Created on first save (upsert).
CREATE TABLE IF NOT EXISTS automation_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Schedule-based triggers
  schedule_enabled boolean NOT NULL DEFAULT false,
  work_days integer[] NOT NULL DEFAULT '{0,1,2,3,4}', -- 0=Sun, 1=Mon, ..., 6=Sat
  default_start_time time NOT NULL DEFAULT '08:00',
  default_end_time time,
  reminder_offset_minutes integer NOT NULL DEFAULT 0, -- minutes before start_time to send push

  -- Geofence-based triggers (foreground only on PWA)
  geofence_enabled boolean NOT NULL DEFAULT false,
  active_location_id uuid REFERENCES work_locations(id) ON DELETE SET NULL,
  geofence_require_schedule_window boolean NOT NULL DEFAULT true, -- only trigger during work_days/hours

  -- Automation mode
  automation_mode text NOT NULL DEFAULT 'suggest'
    CONSTRAINT automation_mode_check CHECK (automation_mode IN ('suggest', 'auto')),

  -- Forgotten shift protection
  auto_clock_out_enabled boolean NOT NULL DEFAULT false,
  auto_clock_out_after_hours integer NOT NULL DEFAULT 12,
  forgotten_shift_reminders boolean NOT NULL DEFAULT true,

  -- Web Push subscription (stored as JSON)
  push_subscription jsonb,

  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE work_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;

-- RLS: work_locations — users manage their own
CREATE POLICY "users manage own locations"
  ON work_locations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS: automation_settings — users manage their own
CREATE POLICY "users manage own automation settings"
  ON automation_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-update updated_at on automation_settings
CREATE TRIGGER update_automation_settings_updated_at
  BEFORE UPDATE ON automation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_work_locations_user_id ON work_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_settings_user_id ON automation_settings(user_id);
