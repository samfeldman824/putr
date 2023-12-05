def get_min_and_max_names(amount_dict: dict):
    """
    Returns the names with the maximum and minimum amounts from the given
    amount_dict.

    Args:
        amount_dict (dict): A dictionary containing names as keys and amounts
        as values.

    Returns:
        tuple: A tuple containing two lists - the names with the maximum amount
        and the names with the minimum amount.
    """
    min_names = []
    max_names = []
    min_amount = float('inf')
    max_amount = float('-inf')

    for name, amount in amount_dict.items():
        if amount == max_amount:
            max_names.append(name)
        elif amount > max_amount:
            max_names = [name]
            max_amount = amount

        if amount == min_amount:
            min_names.append(name)
        elif amount < min_amount:
            min_names = [name]
            min_amount = amount

    return max_names, min_names
