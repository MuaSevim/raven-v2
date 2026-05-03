UPDATE "Shipment"
SET "imageUrl" = NULL
WHERE "imageUrl" LIKE 'data:%';

UPDATE "User"
SET "avatar" = NULL
WHERE "avatar" LIKE 'data:%';
