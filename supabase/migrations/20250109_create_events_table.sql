-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT -- Admin who created the event
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- Insert the existing events from db.json
INSERT INTO events (title, description, event_date, location) VALUES
('class of 2025 sign out', 'after concluding their final exams, the class of 2025 will sign out of Yano School.', '2025-07-01T09:00:00Z', 'Main Hall'),
('Inter-house Sports', 'A day filled with athletic challenges, team spirit, and fun.', '2025-07-10T10:00:00Z', 'School Field'),
('Class of 2009 Reunion', 'A lovely gathering of the class of 2009 to reminisce and reconnect.', '2025-06-10T15:00:00Z', 'School Field'),
('Graduation Ceremony', 'A grand send-off for our graduating students.', '2025-07-26T10:00:00Z', 'Yano School Hall'),
('Parent-Teacher Conference', 'Discuss student progress and curriculum insights.', '2025-08-05T13:00:00Z', 'Staff Room'),
('Literacy Day Celebration', 'Celebrating the importance of reading and writing with competitions and exhibitions.', '2025-09-08T11:00:00Z', 'Library');

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (anyone can view active events)
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (is_active = true);

-- Policy for admin full access (you'll need to adjust based on your auth setup)
CREATE POLICY "Admins can manage events" ON events
    FOR ALL USING (true); -- You can make this more restrictive based on your admin auth
