from poker import Poker
import click


def main():
    # add_poker_game("ledgers/ledger11_09.csv", "data.json", [])
    # unique_nicknames('ledgers')
    # reset_net_games_played('data.json')
    # sort_days_list('data.json')
    # add_all_games('ledgers', 'data.json', ["Ethan", "Theo", "Father Kasarov",
    #                   "lukas", "tiff", "grant lumkong"])
    # print_winnings_of_game("ledgers/ledger11_07(1).csv")
    # add_fields("data.json")
    poker = Poker("ledgers", "data.json")
    # poker.add_poker_game("fake_path.csv")
    poker.reset_net_fields()
    poker.add_all_games(["Ethan", "Theo", "Father Kasarov", "lukas", "tiff",
                         "grant lumkong"])
    # poker.add_poker_game("ledgers/ledger11_10.csv")
    # poker.add_field()

    # poker.reset_net_fields()
    # if len(sys.argv) > 1:

    #     # for adding game
    #     if sys.argv[1] == "ag":
    #         csv_path = f"{poker.ledger_folder_path}/ledger{sys.argv[2]}.csv"
    #         poker.add_poker_game(csv_path)

    #     # for printing results of game
    #     if sys.argv[1] == "pg":
    #         csv_path = f"{poker.ledger_folder_path}/ledger{sys.argv[2]}.csv"
    #         poker.print_game_results(csv_path)

    #     if sys.argv[1] == "pgs":
    #         poker.print_all_games()

    # print("\ndone")


@click.group()
def cli():
    """Poker Game Management System."""
    pass


@cli.command()
@click.argument('ledger_date')
def pg(ledger_date):
    """Print the results of a poker game."""
    poker = Poker("ledgers", "data.json")
    csv_path = f"{poker.ledger_folder_path}/ledger{ledger_date}.csv"
    poker.print_game_results(csv_path)


@cli.command()
def pgs():
    """Print all games."""
    poker = Poker("ledgers", "data.json")
    poker.print_all_games()


@cli.command()
@click.argument('ledger_date')
def ag(ledger_date):
    """Add a poker game."""
    poker = Poker("ledgers", "data.json")
    csv_path = f"{poker.ledger_folder_path}/ledger{ledger_date}.csv"
    poker.add_poker_game(csv_path)


if __name__ == "__main__":
    main()
    cli()
