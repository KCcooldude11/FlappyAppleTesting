FLAPPY APPLE - MODULAR REFACTORING GUIDE
========================================

OVERVIEW
--------
The codebase has been refactored from a single 1400+ line file (main.v4.js) into
a modular ES6 structure with clear separation of concerns. All gameplay behavior
and visuals remain identical, only the organization has changed.


MIGRATION CHECKLIST (Step-by-Step)
=====================================================

[ ] Phase 1: Backup & Verify
  [ ] Create a git branch or backup copy of main.v4.js
  [ ] Note current game version and build date
  [ ] Record any custom tweaks or modifications to main.v4.js

[ ] Phase 2: File Structure
  [ ] Confirm src/ folder structure exists with all subdirectories:
      - render/, entities/, physics/, input/, audio/, net/, storage/, systems/, utils/
  [ ] Verify all 40+ new .js files in src/ are present
  [ ] index.html now references <script type="module" src="./src/main.js">

[ ] Phase 3: First Run
  [ ] Open index.html in browser (local file or dev server)
  [ ] Check console for errors (F12 > Console)
  [ ] Verify game loads to "Ready" state with home screen overlay
  [ ] Username input visible and responsive

[ ] Phase 4: Input & Gameplay
  [ ] Click "Play" button - game should start
  [ ] Flap with Space, Up Arrow, or canvas click
  [ ] Bird responds to input correctly
  [ ] Pipes spawn and move at expected speed

[ ] Phase 5: Core Gameplay Mechanics
  [ ] Collision with pipes causes game over
  [ ] Collision with ground/ceiling causes game over
  [ ] Score increments when passing pipes
  [ ] Score display updates in real-time
  [ ] Best score persists after reload

[ ] Phase 6: Skins & Medallions
  [ ] Medallions spawn on random pipes
  [ ] Collecting medallion advances to next skin
  [ ] Merrikh unlocks at score 301 (pipe spawn count)
  [ ] After Merrikh unlock, skin cycling still works

[ ] Phase 7: Themes
  [ ] Theme 1 active at start (default background + spires)
  [ ] Theme 2 activates at score 100 (fade transition visible)
  [ ] Theme 2: Water particles visible at bottom
  [ ] Theme 3 activates at score 200 (fade transition visible)

[ ] Phase 8: Network & Storage
  [ ] Device ID generated and stored in localStorage
  [ ] Username saved locally
  [ ] On game over: "Your ranking" section appears (if not on leaderboard)
  [ ] Leaderboard fetches and displays top 10 scores
  [ ] Edit username button works (opens rename dialog)
  [ ] Rename persists and updates API

[ ] Phase 9: Responsive Design
  [ ] Test on mobile viewport (375x667 px)
  [ ] Canvas fills screen without gaps
  [ ] Text scaling is readable on small screens
  [ ] Touch input works (no double-tap zoom)
  [ ] Landscape orientation works correctly

[ ] Phase 10: Performance
  [ ] Game runs smoothly at 60 FPS
  [ ] No memory leaks on repeated plays
  [ ] Check DevTools Performance tab for smooth frame rate
  [ ] Water particles (Theme 2) don't cause stutter when full

[ ] Phase 11: Edge Cases
  [ ] Try rapid flapping - input remains responsive
  [ ] Rename to empty string - button disabled
  [ ] Rename to "guest" - button disabled (reserved name)
  [ ] Close rename dialog without saving - name unchanged
  [ ] Play multiple runs in succession - state resets cleanly

[ ] Phase 12: Deployment
  [ ] Build works with Netlify deploy
  [ ] Netlify functions still respond (/register-identity, /submit-score, etc.)
  [ ] Game loads from production URL
  [ ] Leaderboard works in production environment

[ ] Phase 13: Remove Old File
  [ ] After all tests pass, delete main.v4.js from repo
  [ ] Commit refactored code with message documenting migration


REGRESSION TESTS (Quick Manual Tests)
=============================================

Test 1: PHYSICS & GRAVITY
  Action: Play a game, let bird fall straight without flapping
  Expected: Bird accelerates downward, speed increases visibly, hits ground
  Result: [ PASS ] [ FAIL ]

Test 2: FLAPPING & VELOCITY
  Action: Play game, flap once when bird is falling fast
  Expected: Bird jumps up, velocity resets, begins falling again smoothly
  Result: [ PASS ] [ FAIL ]

Test 3: PIPE COLLISION (TOP)
  Action: Play until score 2, deliberately hit top pipe
  Expected: Game over immediately, not delayed
  Result: [ PASS ] [ FAIL ]

Test 4: PIPE COLLISION (BOTTOM)
  Action: Play until score 2, deliberately hit bottom pipe
  Expected: Game over immediately, not delayed
  Result: [ PASS ] [ FAIL ]

Test 5: SCORING
  Action: Pass 5 pipes cleanly without hitting
  Expected: Score shows 5, best persists after game over
  Result: [ PASS ] [ FAIL ]

Test 6: GAP RANDOMIZATION
  Action: Play 10 runs, observe pipe gaps
  Expected: Gaps vary in height, not always in same position
  Result: [ PASS ] [ FAIL ]

Test 7: MEDALLION SPAWN (Regular)
  Action: After first medallion spawns, collect it
  Expected: Skin changes to next available, can continue flapping
  Result: [ PASS ] [ FAIL ]

Test 8: MEDALLION UNLOCK (Merrikh)
  Action: Score high enough (spawn 301 pipes), collect special medallion
  Expected: Merrikh skin activates, locked until this run ends
  Result: [ PASS ] [ FAIL ]

Test 9: THEME TRANSITION
  Action: Play until score 100, then 120, then 200
  Expected: Smooth crossfade between backgrounds at 100 and 200
  Result: [ PASS ] [ FAIL ]

Test 10: LEADERBOARD REQUEST
  Action: Complete a game with valid username, check gameover screen
  Expected: Leaderboard displays within 2 seconds, no errors in console
  Result: [ PASS ] [ FAIL ]

ISSUES FOUND & RESOLUTIONS
====================================

Issue: Game doesn't load
  - Check browser console for errors
  - Verify all imports in src/ are spelled correctly
  - Check that index.html points to <script type="module" src="./src/main.js">
  - Ensure you are running on http:// or https:// (file:// won't work with ES modules)

Issue: Score doesn't increment
  - Verify that pipes are actually passing the bird (not colliding)
  - Check that gameState.score is logged in console during play
  - Confirm bird x-position is correct (should be ~28% of screen width)

Issue: Skins don't change
  - Verify skin images are loading (check Network tab in DevTools)
  - Ensure SKINS array in config.js has correct asset paths (./assets/*)
  - Confirm medallion is being collected (check console logs)

Issue: Leaderboard not showing
  - Check Netlify functions are deployed
  - Verify CORS headers allow cross-origin requests
  - Check network requests in DevTools > Network tab for score submission endpoint

Issue: Canvas is blurry
  - Verify DPR (device pixel ratio) calculation in render/index.js
  - Confirm ctx.setTransform is called with correct DPR values
  - Check browser zoom level is at 100%


ARCHITECTURE SUMMARY
======================

Single State Object (state.js)
  - All game state lives in gameState export
  - Immutable where possible, predictable mutations
  - No hidden state in closures or global variables

Game Loop (loop.js)
  - Single RAF loop
  - Calls update() then render() each frame
  - Delta time calculated from timestamps

Update Logic (update.js)
  - All game physics and logic
  - Returns collision event or null
  - Modifies gameState in-place

Rendering (render/*)
  - Canvas setup and DPR scaling
  - Background caching with focused crop
  - Segmented pipe drawing
  - Bird sprite rotation
  - Water particles (Theme 2 only)
  - UI overlays (home, game over, leaderboard, rename)

Physics (physics/*)
  - Collision detection (circle vs rect)
  - Gravity and velocity dynamics
  - No allocations in hot path

Entities (entities/*)
  - Bird, pipe, medallion, background creation/manipulation
  - Spawn logic for pipes and medallions
  - Spire art quantization and scaling

Systems (systems/*)
  - Theme transitions and alpha blending
  - Skin switching and unlock rules
  - Medallion spawn economy

Input (input/handler.js)
  - Prevents browser gestures on canvas
  - Keyboard, pointer, and touch input
  - Button event delegation

Network (net/api.js)
  - Fetch calls to Netlify functions
  - No blocking UI on network errors

Storage (storage/local-storage.js)
  - Device ID, player name, best score persistence

Utils (utils/*)
  - Math helpers (clamp, random, distance)
  - String formatting (name validation, score display)
  - HTML escaping for security

Config (config.js)
  - Skin definitions and preload
  - Device detection (mobile breakpoint)
  - Screen DPR scaling


PERFORMANCE NOTES
====================

- Bird sprites preloaded at app start, no per-frame allocation
- Background cached as offscreen canvas (updated only on theme change or resize)
- Water particles pooled, reused, no allocation in update loop
- Collision detection uses bounding circle/rect, not pixel-perfect
- No layout thrashing (canvas size accessed once per frame)
- requestAnimationFrame for smooth 60 FPS


KNOWN LIMITATIONS & FUTURE WORK
==================================

- Sound effects placeholder (no audio implemented yet)
- No analytics tracking
- No pause feature during gameplay
- No settings menu (mute, difficulty, etc.)
- Water particles only on Theme 2 (as designed)
- No offline support (requires network for leaderboard)
- No touch gesture support beyond tap to flap


REVERTING TO OLD VERSION
===========================

If you need to revert:
  1. git checkout main.v4.js
  2. Update index.html to point to <script src="./main.v4.js">
  3. git add index.html main.v4.js && git commit -m "Revert to monolithic version"

The old version is preserved in version control history.


TESTING ENVIRONMENT SETUP
===========================

Local Development:
  npx http-server .
  Open http://localhost:8080

Or:
  python3 -m http.server 8000
  Open http://localhost:8000

Netlify Dev:
  netlify dev
  Opens http://localhost:8888


CHANGELOG
===========

v1.0 (Refactored)
  - Split main.v4.js into 40+ modular files
  - Introduced ES6 modules (no build step required)
  - Preserved 100% of gameplay and visual behavior
  - Improved code organization and testability
  - Added clearer separation of concerns
  - No external dependencies added
  - No build tooling required
  - Maintains responsive design
  - Fully Netlify-compatible

v0.4 (Previous)
  - Single-file implementation (main.v4.js)
  - All logic in one 1400+ line IIFE
  - Difficult to test individual systems
  - Large barrier to contribution/maintainability
