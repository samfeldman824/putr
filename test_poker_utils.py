from poker_utils import get_min_and_max_names

def test_get_extreme_names():
    # Test case 1: Empty dictionary
    amount_dict = {}
    assert get_min_and_max_names(amount_dict) == ([], [])

    # Test case 2: Dictionary with one name and amount
    amount_dict = {'John': 100}
    assert get_min_and_max_names(amount_dict) == (['John'], ['John'])

    # Test case 3: Dictionary with multiple names and amounts
    amount_dict = {'John': 100, 'Alice': 200, 'Bob': 150, 'Eve': 200}
    assert get_min_and_max_names(amount_dict) == (['Alice', 'Eve'], ['John'])

    # Test case 4: Dictionary with negative amounts
    amount_dict = {'John': -100, 'Alice': -200, 'Bob': -150, 'Eve': -200}
    assert get_min_and_max_names(amount_dict) == (['John'], ['Alice', 'Eve'])

    # Test case 5: Dictionary with equal amounts
    amount_dict = {'John': 100, 'Alice': 100, 'Bob': 100, 'Eve': 100}
    assert get_min_and_max_names(amount_dict) == (['John', 'Alice', 'Bob', 'Eve'], ['John', 'Alice', 'Bob', 'Eve'])


