-- Migration script to update meeting_type from GOOGLE_MEET to ZOOM_MEET
UPDATE meetings SET meeting_type = 'ZOOM_MEET' WHERE meeting_type = 'GOOGLE_MEET';
