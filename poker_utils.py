def get_extreme_names(amount_dict: dict):
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