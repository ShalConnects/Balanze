-- 1. Try inserting a valid purchase_id into purchase_attachments (should succeed)
INSERT INTO purchase_attachments (purchase_id, file_name, file_path, file_size, file_type, mime_type, user_id)
SELECT purchase_id, 'testfile.txt', '/tmp/testfile.txt', 123, 'txt', 'text/plain', user_id
FROM purchases
LIMIT 1;

-- 2. Try inserting an invalid purchase_id (should fail)
-- This should throw a foreign key violation error
-- Uncomment to test
-- INSERT INTO purchase_attachments (purchase_id, file_name, file_path, file_size, file_type, mime_type, user_id)
-- VALUES ('ZZZZZZZZ', 'badfile.txt', '/tmp/badfile.txt', 123, 'txt', 'text/plain', NULL);

-- 3. Clean up the test row
DELETE FROM purchase_attachments WHERE file_name = 'testfile.txt' OR file_name = 'badfile.txt';

-- 4. Show all purchase_id values in purchases and purchase_attachments
SELECT 'purchases' AS table_name, purchase_id FROM purchases;
SELECT 'purchase_attachments' AS table_name, purchase_id FROM purchase_attachments; 