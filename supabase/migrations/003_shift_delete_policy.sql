-- Add RLS Policy to allow users to delete their own shifts
CREATE POLICY "users can delete own shifts"
  ON shifts FOR DELETE USING (auth.uid() = user_id);
