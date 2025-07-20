-- Add ride management columns to captains table
ALTER TABLE `captains` ADD COLUMN `is_active` BOOLEAN DEFAULT FALSE;
ALTER TABLE `captains` ADD COLUMN `current_route` VARCHAR(100) NULL; 