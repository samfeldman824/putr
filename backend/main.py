from poker import Poker
import click
from typing import List


def main():
    
    # poker = Poker("ledgers", "data.json")
    # poker.reset_net_fields()
    # poker.add_all_games(["Ethan", "Theo", "Father Kasarov", "tiff",
                        #  "grant lumkong", "N52MC", "aapexx13", "GRANT LUMKONG",
                        #  "Ed", "ZestyZander", "lukas_recruit"])

    pass


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
@click.argument('ledger_dates', nargs=-1)
def cb(ledger_dates: List[str]):
    """Combine and print results from multiple games by ledger_date (e.g. 23_10_18 23_10_19)."""
    poker = Poker("ledgers", "data.json")
    ledger_paths = [f"{poker.ledger_folder_path}/ledger{date}.csv" for date in ledger_dates]
    poker.print_combined_results(ledger_paths)


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

@cli.command()
@click.argument('nickname')
@click.option('-n', default=5, help="Number of games to print.")
def plg(nickname, n):
    """Print the last few games of a player."""
    poker = Poker("ledgers", "data.json")
    poker.print_last_games(nickname, int(n))

if __name__ == "__main__":
    main()
    cli()
