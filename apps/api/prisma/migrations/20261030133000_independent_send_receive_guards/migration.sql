-- Ensure each recipient can hold at most one active incoming Hook.
CREATE UNIQUE INDEX "HookAssignment_one_active_received_per_recipient"
ON "HookAssignment" ("recipientId")
WHERE "status" IN ('ASSIGNED', 'VIEWED');

-- Ensure each author can have at most one active published Hook.
CREATE UNIQUE INDEX "Hook_one_active_published_per_author"
ON "Hook" ("authorId")
WHERE "status" IN ('WAITING_MATCH', 'ASSIGNED', 'ANSWERED');
