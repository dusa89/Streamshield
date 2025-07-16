# StreamShield App Overhaul Project Plan

## Overall Goal
Make StreamShield a polished, error-free app that:
- Logs in securely with Spotify (no more revoked tokens or refresh fails)
- Creates "shield" playlists to separate listening sessions (e.g., Work vs. Personal) without messing up recommendations
- Runs smoothly on Android (emulator and phone), with no crashes on startup
- Uses the latest code standards for reliability, speed, and security
- Matches user vision (e.g., skips login if already signed in, goes straight to main screen)

**Timeline Estimate**: 1-2 sessions for fixes, plus testing. One phase at a time, confirm with user, then move on.

## Phase 1: Gather Full Context and Audit (Start - Preparation)
**What I'll Do**: Before touching code, thoroughly scan the entire project to spot every error, outdated part, and mismatch.

### Steps:
- [x] Use search tools to scan all files (grep for "error", "token", "Spotify" patterns; file_search for auth-related files)
- [x] Read key files fully (auth.ts, useSpotifyAuth.ts, protectionMechanism.ts) to map how auth, playlists, and shields work
- [x] Check for outdated stuff: Look for old React Native patterns (e.g., deprecated hooks), TypeScript errors, missing async handling, or insecure token storage
- [x] Review logs for patterns (e.g., "invalid_grant" means Spotify revoked the token due to multiple logins or bad redirects)

**Why**: Errors stem from code mismatches (e.g., old auth flow clashing with new Supabase/Spotify APIs). This ensures the "full picture" per best practices.

**Tools I'll Use**: read_file, grep_search, file_search (all handled by me—no action from user).

**User Role**: None yet—just let me know if you see new errors while I work.

**Output**: A quick summary of findings (e.g., "Found 5 outdated hooks and 3 token bugs").

**Time**: Quick—done in this chat.

### Phase 1 Findings Summary:
**Auth and Spotify Login**: 
- Solid token storage and refresh system via Supabase backend
- Known runtime issues: "invalid_grant" errors from revoked refresh tokens
- Login flow works but can redirect to "not found" screen
- Multiple login attempts can cause loops
- Need better error handling and user-friendly messages

**Startup and Initialization**:
- Main layout checks authentication and redirects appropriately
- Hydration crashes possible if tokens are missing/expired
- Initialization hook may fail silently if auth isn't ready

**Code Quality Issues**:
- 76 linter issues (27 errors, 49 warnings)
- Unused variables and imports throughout codebase
- Single quotes instead of double quotes (27 errors)
- Unsafe non-null assertions (TypeScript warnings)
- Missing "reset" method in protectionMechanism causing test failures

**Outdated Patterns**:
- Some useEffect hooks could be optimized
- State management good but could use latest Zustand patterns
- TypeScript inconsistencies in some areas
- Potential circular dependencies from recent auth changes

## Phase 2: Fix Immediate Errors (Core Bug Squashing)
**What I'll Do**: Tackle the biggest pains first: Spotify token revokes, refresh fails, startup crashes, and "not found" screens.

### Steps:
- [x] **Spotify Auth Fix**: Update hooks/useSpotifyAuth.ts and stores/auth.ts to handle token revokes gracefully—add a "force refresh" with error checking (e.g., if "invalid_grant", clear old tokens and prompt re-login once). Use latest Spotify OAuth 2.0 standards (secure redirects, scope limiting)
- [x] **Redirect After Login**: Create/edit a callback screen (app/spotify-callback.tsx) to handle post-login redirects, routing straight to the main shield screen (app/(tabs)/index.tsx). Skip login if tokens are valid (per user request)
- [x] **Crash on Startup**: Edit app/_layout.tsx and useInitialization.ts to add better error boundaries (catch crashes) and auto-skip to main if logged in. Fix emulator-specific glitches (e.g., add Android permissions checks)
- [x] **Token Refresh Backend**: Tweak supabase/functions/spotify-token-refresh/index.ts for robust error handling (e.g., retry on "non-2xx" codes, log more details). Redeploy via command if needed (I'll run it non-interactively)
- [x] **General Error Handling**: Add toasts (via components/SuccessToast.tsx) for user-friendly messages (e.g., "Token expired—reconnecting...")
- [x] **Linter Fixes**: Fix 27 quote errors and remove unused variables to clean up codebase

**Why**: Logs show revoked tokens from bad refreshes; crashes from unhandled async errors. This brings it to current standards (e.g., Expo's async best practices).

**Tools I'll Use**: edit_file for changes, run_terminal_cmd for deploys (hang-proof with flags like --quiet; is_background: true for long runs).

**User Role**: After changes, reload the app (hit 'r') and test (e.g., tap "Reconnect Spotify"). Share logs/screenshots if issues persist—tell me if you like the flow (e.g., "Make the button blue").

**Output**: Confirmed fixes (e.g., "Tokens now refresh without errors"). Test on emulator/phone.

**Time**: Main focus of next 1-2 responses.

## Phase 3: Modernize Codebase to Industry Standards (Update and Refactor)
**What I'll Do**: Systematically upgrade everything to state-of-the-art (e.g., React Native 0.74+, Expo 51+, TypeScript 5.3+, secure patterns). No leaving old code behind—update all related files at once.

### Steps (Batch by Area):
- [ ] **Auth/Spotify Integration**: Refactor useSpotifyAuth.ts and services/spotify.ts to use modern hooks (useCallback for memos, async/await with try-catch). Add runtime validation (e.g., zod for token shapes). Align with Spotify's 2024 API (e.g., PKCE for security)
- [ ] **State Management**: Update stores (auth.ts, shield.ts, rules.ts) to Zustand 4+ patterns (immutable updates, middleware for persistence). Fix any TypeScript mismatches (e.g., strict types for tracks)
- [ ] **UI/Components**: Modernize screens (e.g., app/(tabs)/index.tsx, settings/shield.tsx) with React Native's latest (e.g., Pressable over Touchable, FlatList optimizations). Add accessibility (aria-labels) and animations (via Reanimated)
- [ ] **Services/Backend**: Update protectionMechanism.ts and supabase functions for async safety (e.g., debounce API calls). Add tests (services/__tests__/protectionMechanism.test.ts) using Jest 29+
- [ ] **Overall Project**: Run linter fixes (eslint.config.js), update dependencies (package.json via npm commands), and add missing types (types/track.ts). Ensure cross-platform (Android/iOS) with Expo config
- [ ] **Security/Performance**: No hardcoded secrets, add memoization to prevent re-renders, validate inputs to avoid crashes

**Why**: As user guessed, mismatches from old code (e.g., previous agents using deprecated methods) cause errors. This follows 2024 standards (e.g., from React Native docs: use hooks properly, handle async deeply).

**Tools I'll Use**: grep_search for outdated patterns, edit_file for batch updates, run_terminal_cmd for installs/tests (non-interactive, background where possible).

**User Role**: Feedback on UI/feel (e.g., "I want the shield screen to have smoother buttons"). Approve changes via PR if big (per repo rules).

**Output**: A "before/after" summary (e.g., "Updated 10 files—app now uses latest auth").

**Time**: Spread over 2-3 chats, testing after each batch.

## Phase 4: Test and Verify (Quality Check)
**What I'll Do**: Run full tests to ensure no regressions—simulate user setup (Windows, Android emulator).

### Steps:
- [ ] Unit tests (e.g., stores/__tests__/shield.test.ts) and add new ones for auth flows
- [ ] Manual sim: Start app, login, create shield, check playlists in Spotify
- [ ] Edge cases: Test revoked tokens, offline mode, emulator crashes
- [ ] Build APK for user's S25 Ultra (via command) and confirm it runs

**Why**: Per repo rules, test thoroughly (happy path + edges) to catch hidden bugs.

**Tools I'll Use**: run_terminal_cmd for tests/builds (quiet, background).

**User Role**: Run the app on phone/emulator, share results (e.g., "It crashed here—logs attached").

**Output**: "All tests pass—app is stable."

**Time**: After each phase, final in last chat.

## Phase 5: Polish and Handover (Finish - Ongoing Support)
**What I'll Do**: Add final touches based on user feedback, document changes, and set up for future updates.

### Steps:
- [ ] UI tweaks (e.g., colors.ts for themes, ensure AAA app feel with app name at top)
- [ ] Create PRs (per repo rules) for big changes, remind user to check BugBot
- [ ] Update README.md with how-to-run instructions
- [ ] Monitor for new issues and iterate

**Why**: Ensures the app matches user vision (e.g., straight to main screen) and is maintainable.

**User Role**: Final feedback (e.g., "Add this feature?").

**Output**: "App is ready—here's the PR link."

**Time**: Wrap-up.

## Risks and How I'll Handle Them
- **If Something Breaks**: Roll back via git (I'll handle branches)
- **User OS/Setup**: All commands PowerShell-friendly (e.g., ';' chaining, 2>$null for no hangs)
- **Questions for User**: Do you want iOS/web testing too? Any specific UI changes (e.g., button colors)?

## Progress Tracking
- **Current Phase**: Phase 3 (Modernize Codebase)
- **Last Updated**: 2024-10-08
- **Next Action**: Refactor auth/Spotify integration
- **Completed**: Phase 1 and Phase 2
- **Blockers**: None currently
- **Completed**: Phase 1 (Full audit completed with detailed findings)

## Notes
- User prefers simple explanations (no coding knowledge)
- User handles only 'npm start' commands
- All other terminal commands handled by AI (non-interactive, no hangs)
- User provides feedback on UI/features only
- Follow .cursor/rules/guidelines strictly
- IMPORTANT: Update app_changes_history.md with all changes and check off completed items 