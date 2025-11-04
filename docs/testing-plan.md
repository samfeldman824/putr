# Comprehensive Testing Plan

## Targets
- Raise backend coverage above 90% with `pytest` and `pytest-cov` while recording XML and terminal summaries.
- Expand automated checks with `hypothesis`, `nox`, `vitest`, and `playwright`.
- Stub Firebase interactions consistently across unit and browser tests.

## Backend Unit Layer
- Extend `backend/test_poker.py` using pytest fixtures that create synthetic ledgers under `tmp_path`.
- Cover edge cases for `_validate_paths`, `_load_game_data`, and CSV validation with parametrized tests.
- Drive CLI coverage in `backend/test_main.py` via `click.testing.CliRunner` to exercise command wiring.

## Property-Based Testing
- Add a `tests/property/` package with Hypothesis strategies that synthesize ledger rows.
- Validate invariants for `_calculate_net_winnings`, aggregation helpers, and JSON updates.
- Configure a `--hypothesis-profile` for longer runs without slowing default sessions.

## Coverage & Configuration
- Create `pytest.ini` with `addopts = --cov=backend --cov-report=xml --cov-report=term` and explicit thresholds.
- Mark slow pandas-driven paths using `@pytest.mark.slow` and seed Hypothesis for reproducibility.
- Store coverage artifacts (`coverage.xml`, HTML) for later CI aggregation.

## Automation with Nox
- Introduce `noxfile.py` sessions: `lint`, `tests`, `coverage`, and `frontend`.
- Each session installs dependencies from `requirements.txt` or `package.json` and runs the relevant tooling.
- Enable pip wheel caching and consistent environments across local runs and CI.

## Frontend Unit Tests
- Add `frontend/tests/` with Vitest (`npm install -D vitest`) configured for `jsdom` or `happy-dom` environments.
- Mock Firebase through MSW handlers and document data fixtures for `script.js` and `profile.js`.
- Install coverage providers (e.g., `@vitest/coverage-v8`) and mirror backend thresholds.

## End-to-End Browser Tests
- Create a Playwright suite under `frontend/e2e/` targeting leaderboard and profile flows.
- Run against a Firebase emulator or MSW web socket mocks to isolate external calls.
- Configure headless Chromium runs and shared selectors to reduce flake.

## Data & Fixtures
- Collect representative ledgers in `tests/fixtures/` with helper factories for CSV and JSON structures.
- Reuse fixtures across pytest, Vitest, and Playwright to maintain consistency.

## CI Integration
- Add a GitHub Actions workflow that executes Nox sessions (`python -m nox -s tests`), Vitest coverage, and Playwright suites.
- Cache `pip`, `npm`, and Playwright assets to shorten job times and publish combined coverage artifacts.
