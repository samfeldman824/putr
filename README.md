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
- Interactive profile charts with accessibility features:
  - WCAG AA compliant color palette for enhanced readability
  - Responsive design supporting mobile (≥320px), tablet, and desktop viewports
  - Detailed tooltips showing game stats on hover/tap
  - Pan and zoom functionality for exploring historical data
  - Color-coded trend lines (green for gains, red for losses)

## Testing

Run the following commands for testing

```
# run all tests
pytest

# run all tests with line coverage
coverage run -m pytest && coverage report -m
```

## Profile Chart Configuration

The profile page displays an interactive chart visualizing player performance over time. The chart implementation includes:

### Accessibility Features
- **WCAG AA Compliant Colors**: All chart elements use colors that meet accessibility standards for contrast
  - Positive trends: Dark green (#2E7D32)
  - Negative trends: Dark red (#C62828)
  - Neutral/line: Dark gray (#616161) and blue (#5C6BC0)
- **Descriptive Labels**: Clear axis labels and legend entries
- **Enhanced Tooltips**: Hover/tap reveals detailed game information including:
  - Game date
  - Cumulative net total
  - Individual game change
  - Game sequence number

### Responsive Design
The chart automatically adjusts for different screen sizes:
- **Mobile (320px - 767px)**: Optimized with smaller fonts, rotated labels, and 1.2:1 aspect ratio
- **Tablet (768px - 1023px)**: Balanced view with 1.8:1 aspect ratio
- **Desktop (1024px+)**: Full detail with 2.5:1 aspect ratio

### Interactive Features
- **Pan & Zoom**: Navigate through data using mouse wheel, drag, or pinch gestures
- **Range Filters**: Quick access to Last 5, Last 10, Last 30, All Time, or Best 5-Game Streak
- **Theme Support**: Chart colors adapt to light/dark theme preferences
- **Dynamic Scaling**: Y-axis automatically scales based on data range with appropriate headroom
