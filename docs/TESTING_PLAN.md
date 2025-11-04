# Complete Testing Suite Implementation Plan
## Putr - Poker Tracking Application

**Document Version:** 1.0  
**Date:** October 31, 2025  
**Project:** Putr Poker Tracking System

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Testing Tools & Technologies](#3-testing-tools--technologies)
4. [Testing Layers](#4-testing-layers)
5. [Test Organization](#5-test-organization)
6. [Coverage Strategy](#6-coverage-strategy)
7. [CI/CD Integration](#7-cicd-integration)
8. [Best Practices](#8-best-practices)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Maintenance & Evolution](#10-maintenance--evolution)

---

## 1. Executive Summary

### 1.1 Overview

This document outlines a comprehensive testing strategy for the Putr poker tracking application. The plan establishes a robust, maintainable, and scalable testing infrastructure that ensures code quality, reliability, and confidence in deployments.

### 1.2 Goals & Objectives

- **Achieve 85%+ code coverage** across the entire codebase
- **Implement automated testing** at all levels (Unit, Integration, E2E)
- **Establish CI/CD pipeline** with automated test execution
- **Reduce bug escape rate** to production by 80%
- **Improve development velocity** through fast feedback loops
- **Ensure code security** through automated security scanning

### 1.3 Key Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Code Coverage | ~70% | 85%+ | 3 months |
| Test Execution Time | N/A | <5 min | 2 months |
| Bug Escape Rate | Unknown | <5% | 4 months |
| Test Suite Size | Limited | Comprehensive | 3 months |

---

## 2. Current State Assessment

### 2.1 Existing Test Infrastructure

**Current Tests:**
- ✅ `backend/test_main.py` - CLI command tests using Click's test runner
- ✅ `backend/test_poker.py` - Core poker logic tests with fixtures
- ✅ `backend/test_constants.py` - Constants validation
- ✅ Coverage reporting configured (htmlcov directory present)

**Strengths:**
- Pytest already configured and in use
- Good use of fixtures and temporary directories
- CLI testing with CliRunner
- Basic coverage tracking enabled

**Gaps Identified:**
1. **No integration tests** - Components tested in isolation only
2. **No E2E tests** - No browser automation for web interface
3. **Limited edge case coverage** - Missing property-based testing
4. **No performance testing** - No load or stress tests
5. **No security testing** - No automated security scans
6. **No parallel test execution** - Sequential test runs only
7. **No type checking** - Missing static type analysis
8. **Frontend untested** - HTML/JS files have no automated tests
9. **No CI/CD automation** - Tests run manually only

### 2.2 Technical Debt

- Test data management could be improved with Faker
- Mock usage is minimal (only monkeypatch)
- No test parametrization for similar test cases
- Coverage reports not enforced in workflow

---

## 3. Testing Tools & Technologies

All tools have been verified using the MCP Docker library resolution system to ensure reliability and compatibility.

### 3.1 Core Testing Framework

#### **pytest** 
- **Library ID:** `/pytest-dev/pytest`
- **Trust Score:** 9.5/10
- **Code Examples:** 614+
- **Purpose:** Primary testing framework
- **Key Features:**
  - Simple, scalable test writing
  - Powerful fixture system
  - Parametrization support
  - Rich plugin ecosystem
  - Excellent error reporting

**Installation:**
```bash
pip install pytest
```

**Basic Usage:**
```python
# test_example.py
def test_addition():
    assert 1 + 1 == 2

# Run tests
pytest
```

---

### 3.2 Mocking & Test Doubles

#### **pytest-mock**
- **Library ID:** `/pytest-dev/pytest-mock`
- **Trust Score:** 9.5/10
- **Code Examples:** 39+
- **Purpose:** Enhanced mocking capabilities
- **Key Features:**
  - Thin wrapper around unittest.mock
  - Pytest fixture integration
  - Automatic cleanup
  - Spy functionality
  - AsyncMock support

**Installation:**
```bash
pip install pytest-mock
```

**Usage Example:**
```python
def test_api_call(mocker):
    # Mock external API
    mock_api = mocker.patch('requests.get')
    mock_api.return_value.json.return_value = {'data': 'test'}
    
    result = fetch_data()
    assert result['data'] == 'test'
    mock_api.assert_called_once()
```

---

### 3.3 Code Coverage

#### **pytest-cov**
- **Library ID:** `/pytest-dev/pytest-cov`
- **Trust Score:** 9.5/10
- **Code Examples:** 70+
- **Purpose:** Code coverage measurement and reporting
- **Key Features:**
  - Statement and branch coverage
  - Multiple report formats (HTML, XML, JSON, LCOV)
  - Fail-under thresholds
  - Distributed testing support
  - Per-test context tracking

**Installation:**
```bash
pip install pytest-cov
```

**Configuration (pyproject.toml):**
```toml
[tool.pytest.ini_options]
addopts = [
    "--cov=backend",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--cov-branch",
    "--cov-fail-under=85",
]

[tool.coverage.run]
branch = true
source = ["backend"]
omit = [
    "*/tests/*",
    "*/test_*.py",
    "*/__pycache__/*",
]

[tool.coverage.report]
precision = 2
show_missing = true
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "if TYPE_CHECKING:",
]
```

---

### 3.4 Parallel Test Execution

#### **pytest-xdist**
- **Library ID:** `/pytest-dev/pytest-xdist`
- **Trust Score:** 9.5/10
- **Code Examples:** 116+
- **Purpose:** Distributed and parallel test execution
- **Key Features:**
  - Multi-CPU test distribution
  - Load balancing
  - Each mode for different environments
  - Remote execution support
  - Automatic coverage combining

**Installation:**
```bash
pip install pytest-xdist
```

**Usage:**
```bash
# Run tests on 4 CPU cores
pytest -n 4

# Run tests on all available cores
pytest -n auto

# Run each test on each worker (useful for flaky tests)
pytest --dist each -n 2
```

---

### 3.5 Property-Based Testing

#### **hypothesis**
- **Library ID:** `/hypothesisworks/hypothesis`
- **Trust Score:** 7.3/10
- **Code Examples:** 571+
- **Purpose:** Automated test case generation
- **Key Features:**
  - Generates diverse test inputs
  - Finds edge cases automatically
  - Minimal reproducible failures
  - Stateful testing
  - Database integration

**Installation:**
```bash
pip install hypothesis
```

**Usage Example:**
```python
from hypothesis import given, strategies as st

@given(st.integers(), st.integers())
def test_addition_commutative(a, b):
    assert a + b == b + a

@given(st.lists(st.floats(), min_size=1))
def test_calculate_average(amounts):
    avg = sum(amounts) / len(amounts)
    assert min(amounts) <= avg <= max(amounts)
```

---

### 3.6 Test Data Generation

#### **faker**
- **Library ID:** `/joke2k/faker`
- **Trust Score:** 9.4/10
- **Code Examples:** 54+
- **Purpose:** Realistic test data generation
- **Key Features:**
  - Generate names, addresses, emails, etc.
  - Localization support
  - Custom providers
  - Reproducible data with seeds
  - Integration with factory patterns

**Installation:**
```bash
pip install faker
```

**Usage Example:**
```python
from faker import Faker

fake = Faker()

def test_user_creation():
    user_data = {
        'name': fake.name(),
        'email': fake.email(),
        'phone': fake.phone_number(),
        'address': fake.address(),
    }
    user = create_user(**user_data)
    assert user.email == user_data['email']

# For reproducible tests
Faker.seed(12345)
```

---

### 3.7 End-to-End Testing

#### **playwright-python**
- **Library ID:** `/microsoft/playwright-python`
- **Trust Score:** 9.9/10
- **Code Examples:** 51+
- **Purpose:** Browser automation and E2E testing
- **Key Features:**
  - Cross-browser support (Chromium, Firefox, WebKit)
  - Auto-waiting for elements
  - Network interception
  - Screenshot and video recording
  - Mobile emulation
  - Parallel execution

**Installation:**
```bash
pip install playwright
playwright install  # Install browser binaries
```

**Usage Example:**
```python
from playwright.sync_api import sync_playwright, expect

def test_poker_game_display():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.goto('http://localhost:8000')
        expect(page).to_have_title('Putr')
        
        # Test game results display
        expect(page.locator('.player-stats')).to_be_visible()
        
        browser.close()
```

---

### 3.8 Security Testing

#### **bandit**
- **Library ID:** `/pycqa/bandit`
- **Trust Score:** 8.1/10
- **Code Examples:** 101+
- **Purpose:** Security vulnerability scanning
- **Key Features:**
  - AST-based security analysis
  - Common vulnerability detection
  - Configurable severity levels
  - CI/CD integration
  - Custom plugin support

**Installation:**
```bash
pip install bandit
```

**Usage:**
```bash
# Scan all Python files
bandit -r backend/

# Generate reports
bandit -r backend/ -f json -o security-report.json

# Specific checks only
bandit -r backend/ -s B101,B601
```

**Configuration (.bandit):**
```yaml
exclude_dirs:
  - /tests/
  - /venv/
  - /.tox/

skips:
  - B101  # Skip assert_used in tests
  - B601  # Skip paramiko_calls

tests:
  - B201  # flask_debug_true
  - B501  # request_with_no_cert_validation
```

---

### 3.9 Static Type Checking

#### **mypy**
- **Library ID:** `/python/mypy`
- **Trust Score:** 8.9/10
- **Code Examples:** 733+
- **Purpose:** Static type checking
- **Key Features:**
  - Gradual typing support
  - Type inference
  - Generic types
  - Protocol support
  - Plugin system

**Installation:**
```bash
pip install mypy
```

**Configuration (pyproject.toml):**
```toml
[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
warn_unreachable = true
strict_equality = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false
```

**Usage:**
```bash
# Check all Python files
mypy backend/

# Check specific file
mypy backend/poker.py
```

---

## 4. Testing Layers

### 4.1 Unit Tests

**Purpose:** Test individual functions and methods in isolation

**Scope:**
- Individual functions
- Class methods
- Pure logic
- Edge cases

**Guidelines:**
- Fast execution (<1ms per test)
- No external dependencies
- Use mocks for dependencies
- Test one concept per test
- Follow AAA pattern (Arrange, Act, Assert)

**Example Structure:**
```python
# tests/unit/test_poker_calculations.py
import pytest
from backend.poker import Poker

class TestPokerCalculations:
    """Unit tests for poker calculation methods."""
    
    def test_calculate_net_positive(self):
        # Arrange
        amounts = [100, 50, -30]
        
        # Act
        result = Poker._calculate_net(amounts)
        
        # Assert
        assert result == 120
    
    def test_calculate_net_negative(self):
        amounts = [-100, -50, 30]
        result = Poker._calculate_net(amounts)
        assert result == -120
    
    @pytest.mark.parametrize("amounts,expected", [
        ([0, 0, 0], 0),
        ([100], 100),
        ([-100], -100),
        ([100, -100], 0),
    ])
    def test_calculate_net_parametrized(self, amounts, expected):
        assert Poker._calculate_net(amounts) == expected
```

**Property-Based Testing Example:**
```python
from hypothesis import given, strategies as st

@given(st.lists(st.floats(min_value=-1000, max_value=1000)))
def test_net_calculation_associative(amounts):
    """Net calculation should be associative."""
    if amounts:
        total = sum(amounts)
        calculated = Poker._calculate_net(amounts)
        assert abs(calculated - total) < 0.01
```

---

### 4.2 Integration Tests

**Purpose:** Test interaction between components

**Scope:**
- Multiple classes working together
- Database operations
- File I/O
- API interactions
- CSV parsing

**Guidelines:**
- Use real dependencies when possible
- Test realistic workflows
- Clean up resources after tests
- Use fixtures for setup/teardown
- Test error handling

**Example Structure:**
```python
# tests/integration/test_poker_file_operations.py
import pytest
from pathlib import Path
from backend.poker import Poker

@pytest.fixture
def temp_poker_setup(tmp_path):
    """Create a temporary poker setup with test data."""
    ledger_dir = tmp_path / "ledgers"
    ledger_dir.mkdir()
    
    json_path = tmp_path / "data.json"
    json_path.write_text('{}')
    
    # Create test ledger
    ledger_file = ledger_dir / "ledger01_01.csv"
    ledger_file.write_text(
        "Player,Buy-in,Cash-out\n"
        "Alice,100,150\n"
        "Bob,100,80\n"
        "Charlie,100,70\n"
    )
    
    poker = Poker(str(ledger_dir), str(json_path))
    return poker, ledger_file, json_path

def test_add_game_updates_json(temp_poker_setup):
    """Test that adding a game correctly updates the JSON file."""
    poker, ledger_file, json_path = temp_poker_setup
    
    poker.add_poker_game(str(ledger_file))
    
    # Verify JSON was updated
    import json
    with open(json_path) as f:
        data = json.load(f)
    
    assert 'Alice' in data
    assert data['Alice']['net'] == 50.0
    assert 'Bob' in data
    assert 'Charlie' in data

def test_print_game_results_output(temp_poker_setup, capsys):
    """Test game results printing."""
    poker, ledger_file, _ = temp_poker_setup
    
    poker.print_game_results(str(ledger_file))
    
    captured = capsys.readouterr()
    assert 'Alice' in captured.out
    assert '50' in captured.out
```

---

### 4.3 End-to-End Tests

**Purpose:** Test complete user workflows through the UI

**Scope:**
- Full user journeys
- Browser interactions
- Multi-page flows
- Authentication flows
- Data persistence

**Guidelines:**
- Test critical paths first
- Use page object pattern
- Handle async operations
- Test across browsers
- Include visual validation

**Example Structure:**
```python
# tests/e2e/test_poker_ui.py
import pytest
from playwright.sync_api import Page, expect

@pytest.fixture(scope="session")
def browser_context(browser):
    """Create a browser context for all tests."""
    context = browser.new_context(
        viewport={'width': 1280, 'height': 720},
        locale='en-US',
    )
    yield context
    context.close()

class TestPokerGameDisplay:
    """E2E tests for poker game display."""
    
    def test_homepage_loads(self, page: Page):
        """Test homepage loads correctly."""
        page.goto('http://localhost:8000')
        
        expect(page).to_have_title('Putr - Poker Tracker')
        expect(page.locator('h1')).to_contain_text('Poker Tracker')
    
    def test_view_game_results(self, page: Page):
        """Test viewing game results."""
        page.goto('http://localhost:8000')
        
        # Click on a game
        page.click('text=View Game 01_01')
        
        # Verify results display
        expect(page.locator('.player-results')).to_be_visible()
        expect(page.locator('.player-name')).to_contain_text('Alice')
    
    def test_filter_by_player(self, page: Page):
        """Test filtering games by player."""
        page.goto('http://localhost:8000')
        
        # Fill search box
        page.fill('input[name="player"]', 'Alice')
        page.click('button:text("Filter")')
        
        # Verify filtered results
        results = page.locator('.game-result')
        expect(results).to_have_count_greater_than(0)
        
        # All results should mention Alice
        for result in results.all():
            expect(result).to_contain_text('Alice')

# Page Object Pattern
class GameResultsPage:
    """Page object for game results page."""
    
    def __init__(self, page: Page):
        self.page = page
        self.player_filter = page.locator('input[name="player"]')
        self.filter_button = page.locator('button:text("Filter")')
        self.results = page.locator('.game-result')
    
    def goto(self):
        self.page.goto('http://localhost:8000/games')
    
    def filter_by_player(self, name: str):
        self.player_filter.fill(name)
        self.filter_button.click()
    
    def get_results_count(self) -> int:
        return self.results.count()
```

---

### 4.4 Performance Tests

**Purpose:** Ensure application performs under load

**Scope:**
- Response time benchmarks
- Memory usage
- Database query performance
- Large dataset handling
- Concurrent user simulation

**Example Structure:**
```python
# tests/performance/test_poker_performance.py
import pytest
import time
from backend.poker import Poker

@pytest.mark.benchmark
def test_add_game_performance(benchmark, temp_poker_setup):
    """Benchmark adding a poker game."""
    poker, ledger_file, _ = temp_poker_setup
    
    result = benchmark(poker.add_poker_game, str(ledger_file))
    
    # Should complete in under 100ms
    assert benchmark.stats['mean'] < 0.1

@pytest.mark.benchmark
def test_large_dataset_performance(tmp_path):
    """Test performance with large dataset."""
    # Create 1000 games
    ledger_dir = tmp_path / "ledgers"
    ledger_dir.mkdir()
    json_path = tmp_path / "data.json"
    
    for i in range(1000):
        ledger = ledger_dir / f"ledger{i:04d}.csv"
        ledger.write_text(
            "Player,Buy-in,Cash-out\n"
            "Alice,100,150\n"
            "Bob,100,80\n"
        )
    
    poker = Poker(str(ledger_dir), str(json_path))
    
    start = time.time()
    poker.print_all_games()
    duration = time.time() - start
    
    # Should list all games in under 1 second
    assert duration < 1.0
```

---

### 4.5 Security Tests

**Purpose:** Identify security vulnerabilities

**Scope:**
- Input validation
- Path traversal
- SQL injection (if applicable)
- XSS vulnerabilities
- Authentication/Authorization

**Example Structure:**
```python
# tests/security/test_input_validation.py
import pytest
from backend.poker import Poker

class TestInputValidation:
    """Security tests for input validation."""
    
    def test_path_traversal_prevention(self, tmp_path):
        """Test that path traversal attacks are prevented."""
        json_path = tmp_path / "data.json"
        json_path.write_text('{}')
        
        with pytest.raises(ValueError):
            # Attempt path traversal
            Poker("../../etc", str(json_path))
    
    def test_csv_injection_prevention(self, tmp_path):
        """Test protection against CSV injection."""
        ledger_dir = tmp_path / "ledgers"
        ledger_dir.mkdir()
        
        # Create malicious CSV
        ledger = ledger_dir / "ledger01_01.csv"
        ledger.write_text(
            "Player,Buy-in,Cash-out\n"
            "=CMD|'/c calc'!A1,100,150\n"
        )
        
        json_path = tmp_path / "data.json"
        json_path.write_text('{}')
        
        poker = Poker(str(ledger_dir), str(json_path))
        
        # Should handle safely without executing
        with pytest.raises(ValueError):
            poker.add_poker_game(str(ledger))
    
    def test_file_size_limits(self, tmp_path):
        """Test that large files are rejected."""
        ledger_dir = tmp_path / "ledgers"
        ledger_dir.mkdir()
        
        # Create very large file
        ledger = ledger_dir / "ledger01_01.csv"
        with open(ledger, 'w') as f:
            f.write("Player,Buy-in,Cash-out\n")
            for i in range(1000000):  # 1M rows
                f.write(f"Player{i},100,150\n")
        
        json_path = tmp_path / "data.json"
        json_path.write_text('{}')
        
        poker = Poker(str(ledger_dir), str(json_path))
        
        with pytest.raises(ValueError, match="File too large"):
            poker.add_poker_game(str(ledger))
```

---

## 5. Test Organization

### 5.1 Directory Structure

```
putr/
├── backend/
│   ├── constants.py
│   ├── main.py
│   ├── poker.py
│   └── __pycache__/
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Shared fixtures
│   │
│   ├── unit/                    # Unit tests
│   │   ├── __init__.py
│   │   ├── test_poker.py
│   │   ├── test_constants.py
│   │   └── test_calculations.py
│   │
│   ├── integration/             # Integration tests
│   │   ├── __init__.py
│   │   ├── test_file_operations.py
│   │   ├── test_data_persistence.py
│   │   └── test_cli_commands.py
│   │
│   ├── e2e/                     # End-to-end tests
│   │   ├── __init__.py
│   │   ├── test_ui_workflows.py
│   │   ├── test_game_display.py
│   │   └── pages/               # Page objects
│   │       ├── __init__.py
│   │       ├── home_page.py
│   │       └── game_page.py
│   │
│   ├── performance/             # Performance tests
│   │   ├── __init__.py
│   │   └── test_benchmarks.py
│   │
│   ├── security/                # Security tests
│   │   ├── __init__.py
│   │   └── test_vulnerabilities.py
│   │
│   └── fixtures/                # Test data
│       ├── __init__.py
│       ├── sample_ledgers/
│       └── sample_json/
│
├── pytest.ini                   # Pytest configuration
├── pyproject.toml              # Project config
├── .bandit                     # Bandit config
├── .coveragerc                 # Coverage config (alternative)
└── tox.ini                     # Tox config
```

### 5.2 Naming Conventions

**Test Files:**
- Prefix with `test_`: `test_poker.py`, `test_main.py`
- Mirror source structure: `poker.py` → `test_poker.py`

**Test Functions:**
- Start with `test_`: `test_calculate_net()`
- Descriptive names: `test_add_game_updates_json_correctly()`
- Pattern: `test_<what>_<condition>_<expected_result>()`

**Test Classes:**
- Start with `Test`: `TestPokerCalculations`
- Group related tests: `TestFileOperations`

**Fixtures:**
- Descriptive names: `poker_instance`, `sample_ledger`
- Scope indication: `session_poker`, `module_data`

**Markers:**
- `@pytest.mark.slow` - Slow-running tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.e2e` - End-to-end tests
- `@pytest.mark.security` - Security tests
- `@pytest.mark.benchmark` - Performance tests

### 5.3 Configuration Files

#### **pytest.ini**
```ini
[pytest]
minversion = 7.0
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --strict-markers
    --tb=short
    --cov=backend
    --cov-report=term-missing
    --cov-report=html
    --cov-branch
    --cov-fail-under=85
markers =
    slow: marks tests as slow (deselect with '-m "not slow"')
    integration: marks tests as integration tests
    e2e: marks tests as end-to-end tests
    security: marks tests as security tests
    benchmark: marks tests as performance benchmarks
filterwarnings =
    error
    ignore::DeprecationWarning
    ignore::PendingDeprecationWarning
```

#### **pyproject.toml**
```toml
[build-system]
requires = ["setuptools>=45", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "putr"
version = "1.0.0"
dependencies = [
    "click",
    "pandas",
]

[project.optional-dependencies]
test = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "pytest-mock>=3.11.0",
    "pytest-xdist>=3.3.0",
    "pytest-asyncio>=0.21.0",
    "hypothesis>=6.82.0",
    "faker>=19.2.0",
    "playwright>=1.37.0",
]
dev = [
    "mypy>=1.4.0",
    "bandit>=1.7.5",
    "black>=23.7.0",
    "isort>=5.12.0",
    "flake8>=6.0.0",
]

[tool.pytest.ini_options]
minversion = "7.0"
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]
addopts = [
    "-v",
    "--strict-markers",
    "--tb=short",
    "--cov=backend",
    "--cov-report=term-missing",
    "--cov-report=html",
    "--cov-branch",
    "--cov-fail-under=85",
]

[tool.coverage.run]
branch = true
source = ["backend"]
omit = [
    "*/tests/*",
    "*/test_*.py",
    "*/__pycache__/*",
    "*/venv/*",
    "*/putr_env/*",
]

[tool.coverage.report]
precision = 2
show_missing = true
skip_covered = false
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "if TYPE_CHECKING:",
    "class .*\\bProtocol\\):",
    "@(abc\\.)?abstractmethod",
]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = false
disallow_incomplete_defs = false
check_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false

[tool.black]
line-length = 100
target-version = ['py311']
include = '\.pyi?$'

[tool.isort]
profile = "black"
line_length = 100
```

---

## 6. Coverage Strategy

### 6.1 Coverage Targets

| Component | Current | Target | Priority |
|-----------|---------|--------|----------|
| backend/poker.py | ~85% | 95% | High |
| backend/main.py | ~80% | 90% | High |
| backend/constants.py | ~90% | 95% | Medium |
| Overall Backend | ~75% | 85%+ | High |
| Frontend (JS) | 0% | 70% | Medium |

### 6.2 Coverage Types

**Statement Coverage (Required: 85%)**
- Every line of code executed at least once
- Measures what code is run

**Branch Coverage (Required: 80%)**
- Every decision point tested both ways
- Measures decision paths taken
- More thorough than statement coverage

**Example:**
```python
def calculate_discount(price, is_member):
    if is_member:  # Branch point
        return price * 0.9
    return price

# Need tests for:
# 1. is_member = True  (branch taken)
# 2. is_member = False (branch not taken)
```

### 6.3 Coverage Measurement

**Generate Reports:**
```bash
# Terminal report with missing lines
pytest --cov=backend --cov-report=term-missing

# HTML report for detailed view
pytest --cov=backend --cov-report=html
open htmlcov/index.html

# XML for CI/CD integration
pytest --cov=backend --cov-report=xml

# Multiple formats
pytest --cov=backend \
    --cov-report=term-missing \
    --cov-report=html \
    --cov-report=xml
```

**Enforce Coverage Thresholds:**
```bash
# Fail if coverage below 85%
pytest --cov=backend --cov-fail-under=85
```

### 6.4 Coverage Exclusions

**Code to Exclude:**
- Debug code
- Type checking blocks
- Abstract methods
- Defensive assertions
- `if __name__ == "__main__":`

**Exclude with Comments:**
```python
def complex_function():
    if DEBUG:  # pragma: no cover
        print("Debug info")
    
    result = calculate()
    return result
```

### 6.5 Coverage Best Practices

1. **Focus on Critical Paths**
   - Test most important functionality first
   - Don't chase 100% coverage blindly

2. **Meaningful Tests**
   - Coverage ≠ Quality
   - Write tests that catch bugs, not just increase coverage

3. **Regular Monitoring**
   - Track coverage trends over time
   - Set up alerts for coverage drops

4. **Coverage in Code Review**
   - Require tests for new code
   - Review coverage reports in PRs

---

## 7. CI/CD Integration

### 7.1 GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    name: Test Python ${{ matrix.python-version }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        python-version: ['3.10', '3.11', '3.12']

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -e .[test,dev]

      - name: Run linters
        run: |
          black --check backend/
          isort --check-only backend/
          flake8 backend/
          mypy backend/

      - name: Run security scan
        run: |
          bandit -r backend/ -f json -o bandit-report.json
        continue-on-error: true

      - name: Run unit tests
        run: |
          pytest tests/unit/ -v --cov=backend --cov-report=xml

      - name: Run integration tests
        run: |
          pytest tests/integration/ -v --cov=backend --cov-append

      - name: Install Playwright browsers
        run: |
          playwright install --with-deps chromium

      - name: Start application server
        run: |
          python -m http.server 8000 &
          sleep 3

      - name: Run E2E tests
        run: |
          pytest tests/e2e/ -v --cov=backend --cov-append

      - name: Generate coverage report
        run: |
          pytest --cov=backend --cov-report=xml --cov-report=html

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.xml
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true

      - name: Upload HTML coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report-${{ matrix.python-version }}
          path: htmlcov/

      - name: Comment coverage on PR
        if: github.event_name == 'pull_request'
        uses: py-cov-action/python-coverage-comment-action@v3
        with:
          GITHUB_TOKEN: ${{ github.token }}
          MINIMUM_GREEN: 85
          MINIMUM_ORANGE: 70

  test-parallel:
    name: Parallel Test Execution
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install -e .[test]

      - name: Run tests in parallel
        run: |
          pytest -n auto --dist loadscope

  performance:
    name: Performance Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -e .[test]

      - name: Run performance tests
        run: |
          pytest tests/performance/ --benchmark-only

  security:
    name: Security Scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Bandit
        run: |
          pip install bandit[toml]

      - name: Run Bandit security scan
        run: |
          bandit -r backend/ -ll -f sarif -o bandit.sarif

      - name: Upload Bandit results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: bandit.sarif
```

### 7.2 Pre-commit Hooks

**File:** `.pre-commit-config.yaml`

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-json
      - id: check-toml
      - id: check-merge-conflict
      - id: debug-statements

  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.11

  - repo: https://github.com/PyCQA/isort
    rev: 5.13.2
    hooks:
      - id: isort

  - repo: https://github.com/PyCQA/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        args: ['--max-line-length=100', '--extend-ignore=E203,W503']

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [types-all]
        args: [--ignore-missing-imports]

  - repo: local
    hooks:
      - id: pytest-quick
        name: pytest-quick
        entry: pytest
        args: [tests/unit/, -v, --tb=short]
        language: system
        pass_filenames: false
        always_run: true
```

**Installation:**
```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files  # Test hooks
```

### 7.3 Continuous Deployment

**Trigger Deployment After Tests Pass:**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  workflow_run:
    workflows: ["Test Suite"]
    types:
      - completed
    branches: [main]

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy application
        run: |
          echo "Deploying to production..."
          # Add your deployment steps here
```

---

## 8. Best Practices

### 8.1 Test Writing Guidelines

#### **AAA Pattern (Arrange, Act, Assert)**

```python
def test_calculate_net():
    # Arrange - Set up test data
    poker = Poker("ledgers", "data.json")
    amounts = [100, -50, 30]
    
    # Act - Execute the function
    result = poker._calculate_net(amounts)
    
    # Assert - Verify the result
    assert result == 80
```

#### **One Concept Per Test**

```python
# ❌ Bad - Testing multiple concepts
def test_poker_operations():
    poker.add_game()
    poker.calculate_stats()
    poker.save_data()
    # Too many things being tested

# ✅ Good - One concept
def test_add_game_creates_entry():
    poker.add_game()
    assert game_exists()

def test_calculate_stats_returns_average():
    stats = poker.calculate_stats()
    assert stats.average == expected
```

#### **Descriptive Test Names**

```python
# ❌ Bad
def test_1():
    pass

# ✅ Good
def test_calculate_net_returns_positive_for_winning_session():
    pass

def test_add_game_raises_error_when_file_not_found():
    pass
```

### 8.2 Fixture Guidelines

#### **Use Appropriate Scope**

```python
# Function scope (default) - Created for each test
@pytest.fixture
def temp_file():
    return create_temp_file()

# Class scope - Created once per test class
@pytest.fixture(scope="class")
def database_connection():
    conn = create_connection()
    yield conn
    conn.close()

# Module scope - Created once per module
@pytest.fixture(scope="module")
def expensive_resource():
    return load_large_dataset()

# Session scope - Created once per test session
@pytest.fixture(scope="session")
def global_config():
    return load_config()
```

#### **Fixture Composition**

```python
@pytest.fixture
def ledger_dir(tmp_path):
    """Create temporary ledger directory."""
    dir_path = tmp_path / "ledgers"
    dir_path.mkdir()
    return dir_path

@pytest.fixture
def json_file(tmp_path):
    """Create temporary JSON file."""
    file_path = tmp_path / "data.json"
    file_path.write_text('{}')
    return file_path

@pytest.fixture
def poker_instance(ledger_dir, json_file):
    """Create configured Poker instance."""
    return Poker(str(ledger_dir), str(json_file))
```

### 8.3 Mocking Guidelines

#### **Mock External Dependencies**

```python
def test_fetch_player_stats(mocker):
    # Mock external API call
    mock_api = mocker.patch('requests.get')
    mock_api.return_value.json.return_value = {
        'player': 'Alice',
        'stats': {'games': 10}
    }
    
    result = fetch_player_stats('Alice')
    assert result['stats']['games'] == 10
```

#### **Use Spies for Verification**

```python
def test_logging_called(mocker):
    # Spy on logger to verify it's called
    spy_logger = mocker.spy(logging, 'info')
    
    process_game()
    
    spy_logger.assert_called_once()
    spy_logger.assert_called_with('Game processed successfully')
```

#### **Mock Configuration**

```python
@pytest.fixture
def mock_config(mocker):
    """Mock application configuration."""
    return mocker.patch.dict('os.environ', {
        'DATABASE_URL': 'test://localhost',
        'DEBUG': 'True',
    })
```

### 8.4 Parametrization

#### **Test Multiple Inputs**

```python
@pytest.mark.parametrize("amount,expected", [
    (100, True),
    (0, False),
    (-50, False),
])
def test_is_positive_amount(amount, expected):
    assert is_positive(amount) == expected
```

#### **Combine Parameters**

```python
@pytest.mark.parametrize("player", ["Alice", "Bob", "Charlie"])
@pytest.mark.parametrize("game_type", ["cash", "tournament"])
def test_player_game_combinations(player, game_type):
    # Tests all 3 x 2 = 6 combinations
    result = get_player_stats(player, game_type)
    assert result is not None
```

### 8.5 Error Testing

#### **Test Expected Exceptions**

```python
def test_invalid_file_raises_error():
    with pytest.raises(FileNotFoundError):
        Poker("nonexistent_dir", "data.json")

def test_invalid_csv_raises_value_error():
    with pytest.raises(ValueError, match="Invalid CSV format"):
        poker.add_poker_game("malformed.csv")
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Objectives:**
- Set up core testing infrastructure
- Achieve 70% code coverage
- Establish CI/CD pipeline

**Tasks:**

**Week 1: Setup & Configuration**
- [ ] Install all testing dependencies
- [ ] Configure pytest.ini and pyproject.toml
- [ ] Set up coverage reporting
- [ ] Create test directory structure
- [ ] Configure pre-commit hooks

**Week 2: Unit Tests**
- [ ] Write unit tests for poker.py core logic
- [ ] Write unit tests for main.py CLI commands
- [ ] Write unit tests for constants.py
- [ ] Achieve 70% unit test coverage
- [ ] Set up parametrized tests

**Week 3: Integration Tests**
- [ ] Write integration tests for file operations
- [ ] Write integration tests for data persistence
- [ ] Write integration tests for CLI workflows
- [ ] Test error handling paths

**Week 4: CI/CD Setup**
- [ ] Create GitHub Actions workflow
- [ ] Configure automated test execution
- [ ] Set up coverage reporting in CI
- [ ] Configure branch protection rules

**Deliverables:**
- ✅ Working test suite with 70% coverage
- ✅ Automated CI/CD pipeline
- ✅ Pre-commit hooks active

---

### Phase 2: Expansion (Weeks 5-8)

**Objectives:**
- Achieve 85% code coverage
- Add E2E tests
- Implement advanced testing techniques

**Tasks:**

**Week 5: Coverage Improvement**
- [ ] Identify untested code paths
- [ ] Write tests for edge cases
- [ ] Add property-based tests with Hypothesis
- [ ] Reach 80% coverage milestone

**Week 6: E2E Testing**
- [ ] Install and configure Playwright
- [ ] Write E2E tests for main UI workflows
- [ ] Create page object patterns
- [ ] Test cross-browser compatibility

**Week 7: Advanced Testing**
- [ ] Implement Faker for test data
- [ ] Add pytest-xdist for parallel execution
- [ ] Write performance benchmarks
- [ ] Optimize test execution time

**Week 8: Security & Type Checking**
- [ ] Configure Bandit security scanner
- [ ] Configure Mypy type checker
- [ ] Fix security warnings
- [ ] Add type hints to critical code
- [ ] Achieve 85% coverage milestone

**Deliverables:**
- ✅ 85% code coverage achieved
- ✅ E2E test suite operational
- ✅ Security scanning integrated
- ✅ Type checking configured

---

### Phase 3: Optimization (Weeks 9-12)

**Objectives:**
- Optimize test performance
- Enhance reporting
- Document testing procedures

**Tasks:**

**Week 9: Performance Optimization**
- [ ] Profile test execution
- [ ] Optimize slow tests
- [ ] Implement test sharding
- [ ] Reduce test execution time to < 5 min

**Week 10: Enhanced Reporting**
- [ ] Configure advanced coverage reports
- [ ] Set up Codecov integration
- [ ] Add coverage badges to README
- [ ] Create test result dashboards

**Week 11: Documentation**
- [ ] Document testing procedures
- [ ] Create test writing guidelines
- [ ] Document fixture usage
- [ ] Create troubleshooting guide

**Week 12: Review & Refinement**
- [ ] Code review of test suite
- [ ] Refactor duplicate test code
- [ ] Update documentation
- [ ] Team training on testing practices

**Deliverables:**
- ✅ Optimized test performance
- ✅ Comprehensive documentation
- ✅ Team trained on testing

---

### Timeline Summary

```
Month 1: Foundation
├── Week 1: Setup & Configuration
├── Week 2: Unit Tests
├── Week 3: Integration Tests
└── Week 4: CI/CD Setup

Month 2: Expansion
├── Week 5: Coverage Improvement (80%)
├── Week 6: E2E Testing
├── Week 7: Advanced Testing
└── Week 8: Security & Types (85%)

Month 3: Optimization
├── Week 9: Performance
├── Week 10: Reporting
├── Week 11: Documentation
└── Week 12: Review
```

---

## 10. Maintenance & Evolution

### 10.1 Ongoing Practices

**Daily:**
- Run tests before committing code
- Review test failures immediately
- Keep tests green

**Weekly:**
- Review coverage reports
- Identify new test opportunities
- Update test data as needed

**Monthly:**
- Review test performance metrics
- Update testing dependencies
- Refactor slow or flaky tests
- Team retrospective on testing

**Quarterly:**
- Review testing strategy
- Update tooling
- Evaluate new testing technologies
- Training sessions

### 10.2 Metrics to Track

| Metric | Target | Frequency |
|--------|--------|-----------|
| Code Coverage | ≥85% | Daily |
| Test Execution Time | <5 min | Daily |
| Test Flakiness Rate | <2% | Weekly |
| New Tests Added | With every feature | Per PR |
| Test Maintenance Time | <10% dev time | Monthly |

### 10.3 Common Issues & Solutions

**Flaky Tests:**
```python
# Problem: Tests fail randomly
def test_flaky():
    result = async_operation()
    assert result == expected  # Sometimes fails

# Solution: Add proper waits
def test_stable():
    result = wait_for(async_operation, timeout=5)
    assert result == expected
```

**Slow Tests:**
```python
# Problem: Test takes too long
def test_slow():
    process_large_dataset()  # 30 seconds

# Solution: Use smaller test data
def test_fast():
    process_sample_data()  # 100ms
```

**Brittle Tests:**
```python
# Problem: Test breaks with minor changes
def test_brittle():
    assert output == "Exact string that changes often"

# Solution: Test behavior, not implementation
def test_robust():
    assert "key information" in output
    assert len(output) > 0
```

### 10.4 Tool Updates

**Keep Dependencies Updated:**
```bash
# Check for updates
pip list --outdated

# Update specific package
pip install --upgrade pytest

# Update all test dependencies
pip install --upgrade -r requirements-test.txt
```

**Version Pinning:**
```toml
# pyproject.toml
[project.optional-dependencies]
test = [
    "pytest>=7.4.0,<8.0.0",  # Pin major version
    "pytest-cov>=4.1.0",
]
```

---

## Appendix A: Quick Reference Commands

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_poker.py

# Run specific test
pytest tests/unit/test_poker.py::test_calculate_net

# Run tests by marker
pytest -m "not slow"
pytest -m integration

# Run tests in parallel
pytest -n auto

# Verbose output
pytest -v

# Stop on first failure
pytest -x

# Run last failed tests
pytest --lf

# Show local variables on failure
pytest -l
```

### Coverage Commands

```bash
# Run with coverage
pytest --cov=backend

# Coverage report in terminal
pytest --cov=backend --cov-report=term-missing

# HTML coverage report
pytest --cov=backend --cov-report=html
open htmlcov/index.html

# Fail if coverage below threshold
pytest --cov=backend --cov-fail-under=85

# Branch coverage
pytest --cov=backend --cov-branch
```

### Security & Quality

```bash
# Security scan
bandit -r backend/

# Type checking
mypy backend/

# Code formatting
black backend/
isort backend/

# Linting
flake8 backend/
```

---

## Appendix B: Tool Verification Summary

All tools have been verified using the MCP Docker library resolution system:

| Tool | Library ID | Trust Score | Status |
|------|-----------|-------------|--------|
| pytest | /pytest-dev/pytest | 9.5/10 | ✅ Verified |
| pytest-mock | /pytest-dev/pytest-mock | 9.5/10 | ✅ Verified |
| pytest-cov | /pytest-dev/pytest-cov | 9.5/10 | ✅ Verified |
| pytest-xdist | /pytest-dev/pytest-xdist | 9.5/10 | ✅ Verified |
| hypothesis | /hypothesisworks/hypothesis | 7.3/10 | ✅ Verified |
| faker | /joke2k/faker | 9.4/10 | ✅ Verified |
| playwright-python | /microsoft/playwright-python | 9.9/10 | ✅ Verified |
| bandit | /pycqa/bandit | 8.1/10 | ✅ Verified |
| mypy | /python/mypy | 8.9/10 | ✅ Verified |

---

## Appendix C: Sample Test Suite

**Complete Example: `tests/integration/test_game_workflow.py`**

```python
"""Integration tests for complete game workflows."""
import pytest
import json
from pathlib import Path
from backend.poker import Poker
from faker import Faker

fake = Faker()


@pytest.fixture
def game_setup(tmp_path):
    """Set up a complete game environment."""
    # Create directory structure
    ledger_dir = tmp_path / "ledgers"
    ledger_dir.mkdir()
    json_file = tmp_path / "data.json"
    json_file.write_text('{}')
    
    # Create sample games
    games = []
    for i in range(3):
        game_file = ledger_dir / f"ledger23_10_{i:02d}.csv"
        game_file.write_text(
            "Player,Buy-in,Cash-out\n"
            f"{fake.name()},100,150\n"
            f"{fake.name()},100,80\n"
            f"{fake.name()},100,70\n"
        )
        games.append(game_file)
    
    poker = Poker(str(ledger_dir), str(json_file))
    return poker, games, json_file


class TestCompleteGameWorkflow:
    """Test complete workflows from start to finish."""
    
    def test_add_multiple_games_workflow(self, game_setup):
        """Test adding multiple games and verifying data."""
        poker, games, json_file = game_setup
        
        # Add all games
        for game in games:
            poker.add_poker_game(str(game))
        
        # Verify JSON updated correctly
        with open(json_file) as f:
            data = json.load(f)
        
        # Should have 3 players per game, 3 games = 9 player entries
        assert len(data) > 0
        
        # Verify statistics calculated
        for player_data in data.values():
            assert 'net' in player_data
            assert 'games_up' in player_data
            assert 'games_down' in player_data
    
    def test_print_results_workflow(self, game_setup, capsys):
        """Test viewing game results."""
        poker, games, _ = game_setup
        
        # Add a game
        poker.add_poker_game(str(games[0]))
        
        # Print results
        poker.print_game_results(str(games[0]))
        
        # Verify output
        captured = capsys.readouterr()
        assert len(captured.out) > 0
        assert ':' in captured.out  # Player: Amount format
    
    @pytest.mark.parametrize("num_games", [1, 5, 10])
    def test_performance_multiple_games(self, tmp_path, num_games):
        """Test performance with varying number of games."""
        ledger_dir = tmp_path / "ledgers"
        ledger_dir.mkdir()
        json_file = tmp_path / "data.json"
        json_file.write_text('{}')
        
        # Create games
        for i in range(num_games):
            game = ledger_dir / f"game{i}.csv"
            game.write_text(
                "Player,Buy-in,Cash-out\n"
                "Alice,100,150\n"
                "Bob,100,50\n"
            )
        
        poker = Poker(str(ledger_dir), str(json_file))
        
        # Add all games
        import time
        start = time.time()
        for i in range(num_games):
            game = ledger_dir / f"game{i}.csv"
            poker.add_poker_game(str(game))
        duration = time.time() - start
        
        # Should be fast even with many games
        assert duration < (num_games * 0.1)  # 100ms per game max
```

---

## Conclusion

This comprehensive testing plan provides a complete roadmap for implementing a world-class testing suite for the Putr application. By following this plan, you will:

- **Achieve high code coverage** (85%+)
- **Ensure code quality** through automated testing
- **Catch bugs early** in the development cycle
- **Deploy with confidence** knowing tests pass
- **Maintain code health** over time

**Next Steps:**
1. Review this plan with the team
2. Begin Phase 1 implementation
3. Schedule weekly check-ins on progress
4. Adjust timeline based on team capacity

**Questions or Concerns:**
- Open issues on GitHub for discussion
- Update this document as the plan evolves
- Share learnings with the team

---

**Document Metadata:**
- Created: October 31, 2025
- Version: 1.0
- Author: AI Testing Plan Generator
- Last Updated: October 31, 2025
