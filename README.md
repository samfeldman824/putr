# Poker Tracker

[![codecov](https://codecov.io/github/samfeldman824/putr/branch/main/graph/badge.svg?token=DXNQHZ39YZ)](https://codecov.io/github/samfeldman824/putr)


PUTR is a web application for tracking side poker games. It allows users to record game results, track player statistics, and analyze performance over time.

## Setup

Install required packages with commands below
```
# if using conda
conda env create -f environment.yml
conda activate putr_env

# if using pip
pip install -r requirements.txt

# it is recommended to use a virtual environment
python -m venv venv
source venv/bin/activate
```


## Features

- Record poker game results
- Track player statistics such as wins, losses, and net earnings
- Analyze player performance over time
- Generate leaderboards and rankings

## Testing

### Python Tests

Run the following commands for Python testing

```
# run all tests
pytest

# run all tests with line coverage
coverage run -m pytest && coverage report -m
```

### JavaScript Tests

Run the following commands for JavaScript testing

```
# run all JavaScript tests
npm test

# run specific test suites
npm run test:all          # run all test suites
npm run test:frontend     # run frontend-specific tests
npm run test:browser      # run browser-based tests
npm run test:ci           # run CI test suite
```

**Prerequisites for JavaScript tests:**
- Node.js 16.0.0 or higher
- Install dependencies: `npm install`

**Test files are located in the `tests/` directory and include:**
- Unit tests for individual components
- Integration tests for upload functionality
- Browser-based tests using Puppeteer
- Modal lifecycle and UI interaction tests
