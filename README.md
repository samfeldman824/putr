# Poker Tracker

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
