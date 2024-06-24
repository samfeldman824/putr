# Poker Tracker

[![codecov](https://codecov.io/github/samfeldman824/putr/branch/actions/graph/badge.svg?token=DXNQHZ39YZ)](https://codecov.io/github/samfeldman824/putr)
[![CodeQL](https://github.com/MichaelCurrin/badge-generator/workflows/CodeQL/badge.svg)](https://github.com/MichaelCurrin/badge-generator/actions?query=workflow%3ACodeQL)

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

Run the following commands for testing

```
# run all tests
pytest

# run all tests with line coverage
coverage run -m pytest && coverage report -m
```
