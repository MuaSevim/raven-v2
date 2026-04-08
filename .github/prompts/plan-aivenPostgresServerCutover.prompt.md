## Plan: Aiven Postgres Server Cutover

This plan migrates Raven server database infrastructure from Supabase-hosted Postgres to Aiven Postgres 17 while preserving Firebase auth and leaving client untouched. The recommended path updates server env config, pushes Prisma schema directly into the empty Aiven database, confirms there is no Supabase Storage runtime dependency to remove, then validates boot logs and Prisma connectivity.

**Steps**
1. Phase 1 - Preflight and scope lock
1. Confirm work is restricted to server/ only and keep Firebase auth flow unchanged in auth module files.
2. Confirm current git branch is migration-safe (already on migrate-database) and working tree state is recorded before edits.
3. Phase 2 - Environment cutover (blocks Phase 3)
4. Update server/.env by removing Supabase database URLs.
5. Set DATABASE_URL to the provided Aiven DSN exactly.
6. Set DIRECT_URL to the same Aiven DSN unless a separate non-pooled direct Aiven URL is provided, because prisma.config.ts resolves schema operations from DIRECT_URL.
7. Preserve all Firebase env variables as-is.
8. Phase 3 - Prisma synchronization (depends on Phase 2)
9. Run npm install in server/ if node_modules is missing or stale.
10. Run npx prisma generate in server/.
11. Run npx prisma db push --accept-data-loss in server/ against Aiven.
12. Capture output showing successful schema sync and generated Prisma client.
13. Phase 4 - Storage logic audit and safe fallback (parallel with Phase 3 read-only checks, edits only if needed)
14. Search server source for Supabase SDK/storage references in shipments service/controllers and upload paths.
15. If Supabase storage references are found, isolate that upload path and replace with a temporary placeholder URL-returning function so build succeeds.
16. If no Supabase storage references exist, make no code changes and document that this step is a no-op.
17. Phase 5 - Server runtime validation (depends on Phases 2 and 3)
18. Run npm run start:dev in server/.
19. Confirm startup logs show Nest app boot and no Prisma initialization errors.
20. Confirm server is listening on configured port and report relevant terminal lines.
21. Stop process cleanly after validation and summarize results.

**Relevant files**
- d:/engineering/projects/raven/raven-mobile-v2/codebase/server/.env - Replace Supabase DB URLs with Aiven DSN while retaining Firebase credentials.
- d:/engineering/projects/raven/raven-mobile-v2/codebase/server/prisma.config.ts - Uses DIRECT_URL for schema operations; requires DIRECT_URL to be valid for db push.
- d:/engineering/projects/raven/raven-mobile-v2/codebase/server/prisma/schema.prisma - Authoritative schema blueprint to push into empty Aiven DB.
- d:/engineering/projects/raven/raven-mobile-v2/codebase/server/src/prisma/prisma.service.ts - Runtime Prisma connection path uses DATABASE_URL.
- d:/engineering/projects/raven/raven-mobile-v2/codebase/server/src/shipments/shipments.service.ts - Primary user-requested audit target for upload/storage logic.
- d:/engineering/projects/raven/raven-mobile-v2/codebase/server/package.json - Scripts and dependencies for install/start/prisma tasks.

**Verification**
1. Env verification: server/.env contains no Supabase hostnames and includes Aiven DATABASE_URL and DIRECT_URL.
2. Prisma generation verification: npx prisma generate exits successfully.
3. Schema sync verification: npx prisma db push --accept-data-loss completes without datasource/auth errors.
4. Storage audit verification: search for supabase/storage/upload references in server source confirms no unresolved SDK usage or patched fallback compiles.
5. Runtime verification: npm run start:dev shows Nest startup and no Prisma connection failures.
6. Optional sanity check: call GET / to verify process responds while running.

**Decisions**
- Included scope: server env, Prisma sync, backend storage audit, backend startup validation.
- Excluded scope: client/ changes, Firebase auth behavior changes, broad controller/business logic changes outside storage fallback necessity.
- Migration strategy: use prisma db push (not migration replay) because target DB is new and empty.
- Connection strategy: keep both DATABASE_URL and DIRECT_URL valid to satisfy existing runtime and prisma.config wiring.

**Further Considerations**
1. If Aiven provides separate pooled and direct URLs, prefer direct URL for DIRECT_URL and pooled/session-safe URL for DATABASE_URL to reduce runtime pool issues.
2. After successful cutover, rotate exposed legacy Supabase credentials and Firebase private key if they were ever committed/shared outside secure vaulting.
3. After first successful boot, run seed only if needed for required baseline records.
