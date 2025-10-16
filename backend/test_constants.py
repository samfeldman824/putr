"""
Tests to verify constants are properly defined and used throughout the application.
"""
import pytest
from constants import (
    DEFAULT_GAMES_TO_SHOW,
    CENTS_TO_DOLLARS,
    INITIAL_DATE_KEY,
    DEFAULT_LEDGER_FOLDER,
    DEFAULT_JSON_PATH
)


def test_constants_are_defined():
    """Verify all constants are properly defined."""
    assert DEFAULT_GAMES_TO_SHOW == 5
    assert CENTS_TO_DOLLARS == 100
    assert INITIAL_DATE_KEY == "01_01"
    assert DEFAULT_LEDGER_FOLDER == "ledgers"
    assert DEFAULT_JSON_PATH == "data.json"


def test_constants_are_correct_types():
    """Verify constants have the expected types."""
    assert isinstance(DEFAULT_GAMES_TO_SHOW, int)
    assert isinstance(CENTS_TO_DOLLARS, int)
    assert isinstance(INITIAL_DATE_KEY, str)
    assert isinstance(DEFAULT_LEDGER_FOLDER, str)
    assert isinstance(DEFAULT_JSON_PATH, str)


def test_currency_conversion_constant():
    """Verify the currency conversion constant works as expected."""
    cents = 550
    dollars = cents / CENTS_TO_DOLLARS
    assert dollars == 5.5
    
    cents2 = -425
    dollars2 = cents2 / CENTS_TO_DOLLARS
    assert dollars2 == -4.25


def test_default_values_are_positive():
    """Verify numeric defaults are positive."""
    assert DEFAULT_GAMES_TO_SHOW > 0
    assert CENTS_TO_DOLLARS > 0


def test_string_constants_not_empty():
    """Verify string constants are not empty."""
    assert len(INITIAL_DATE_KEY) > 0
    assert len(DEFAULT_LEDGER_FOLDER) > 0
    assert len(DEFAULT_JSON_PATH) > 0
