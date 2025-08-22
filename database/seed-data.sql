-- Seed data for development
-- Insert a default user for development

INSERT OR IGNORE INTO users (id, email, name, created_at, updated_at) 
VALUES (
  'default-user', 
  'user@example.com', 
  'Default User', 
  datetime('now'),
  datetime('now')
);
