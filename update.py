from colorama import Fore, Style
import json
import os
import requests
import time

# ------------------------------------------------------------------------------
# Constants
# ------------------------------------------------------------------------------
SERVER_URL = "http://localhost:3000/api/data"
ABILITIES = "abilities"
BATTLES = "battles"
GROUPS = "groups"
ITEMS = "items"
MOVES = "moves"
POKEMON = "pokemon"
TRAINERS = "trainers"
CLEAR = "clear"
RESET = "r"
COLLECTIONS = [
    ABILITIES,
    BATTLES,
    GROUPS,
    ITEMS,
    MOVES,
    POKEMON,
    TRAINERS,
    CLEAR,
]


# ------------------------------------------------------------------------------
# Utility Functions
# ------------------------------------------------------------------------------
def print_green(str):
    print(f"{Fore.GREEN}{str}{Style.RESET_ALL}")


def print_red(str):
    print(f"{Fore.RED}{str}{Style.RESET_ALL}")


def print_yellow(str):
    print(f"{Fore.YELLOW}{str}{Style.RESET_ALL}")


def print_cyan(str):
    print(f"{Fore.CYAN}{str}{Style.RESET_ALL}")


def bold(str):
    return f"{Style.BRIGHT}{str}{Style.NORMAL}"


def clear_console():
    os.system("cls" if os.name == "nt" else "clear")


# ------------------------------------------------------------------------------
# Check Connection
# ------------------------------------------------------------------------------
def check_connection():
    try:
        requests.get(SERVER_URL)
        return True
    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
        print_red("The server is unreachable\n")
        return False


# ------------------------------------------------------------------------------
# Gather Input
# ------------------------------------------------------------------------------
def print_options(toggles):
    for idx, collection in enumerate(COLLECTIONS):
        option = f"({collection[0].capitalize()}) {collection.capitalize()}\t"
        print_green(option + "[✓]") if toggles[idx] else print_red(option + "[ ]")
    print_red("(R) Reset\n")


def print_status(selection, toggled):
    if selection == RESET:
        print_yellow("Selections reset")
    elif selection != None and toggled == None:
        print_red("Invalid input")
    elif toggled != None:
        print_yellow(toggled.capitalize() + " was toggled")


def get_selection():
    return (
        input("Pick a field to toggle or leave empty to run the update: ")
        .strip()
        .lower()
    )


def print_groups(groups):
    for idx, group in enumerate(groups):
        print_red(f"({idx + 1}) {group}")
    print()


def get_group():
    groups = ["ruby_sapphire", "emerald"]
    clear_console()
    print_groups(groups)
    idx = int(input("Select a group #: "))
    return groups[idx - 1]


def toggle_selection(selection, toggles):
    start = None
    end = None
    battles_group = None
    segments_group = None

    if selection == RESET:
        return None, [False] * len(COLLECTIONS), None, None, None, None

    for idx, collection in enumerate(COLLECTIONS):
        if collection[0] == selection:
            toggles[idx] = not toggles[idx]
            if toggles[idx]:
                if collection == POKEMON:
                    start = input("Start at #: ")
                    if not start.isdigit():
                        break
                    end = input("End at #: ")
                    if not end.isdigit():
                        break
                elif collection == BATTLES:
                    battles_group = get_group()
                elif collection == GROUPS:
                    segments_group = get_group()
            return collection, toggles, start, end, battles_group, segments_group
    return None


def construct_query(toggles, start, end, battles_group, segments_group):
    params = []
    for idx, collection in enumerate(COLLECTIONS):
        if toggles[idx]:
            params.append(f"{collection}=true")
            if collection == POKEMON:
                params.append(f"pokemon_start={start}")
            if collection == POKEMON:
                params.append(f"pokemon_end={end}")
            if collection == BATTLES:
                params.append(f"battles_group={battles_group}")
            if collection == GROUPS:
                params.append(f"segments_group={segments_group}")

    return SERVER_URL + "?" + "&".join(params)


def gather_input():
    selection = None
    toggled = None
    toggles = [False] * len(COLLECTIONS)

    while selection != "":
        clear_console()
        print_options(toggles)
        print_status(selection, toggled)
        selection = get_selection()
        res = toggle_selection(selection, toggles)
        if res:
            toggled, toggles, start, end, battles_group, segments_group = res

    print()
    return construct_query(toggles, start, end, battles_group, segments_group)


# ------------------------------------------------------------------------------
# Make Request
# ------------------------------------------------------------------------------
def make_request(query):
    clear_console()
    start_time = time.perf_counter()
    print_yellow(bold("Running update..."))
    try:
        r = requests.get(query)
        print_cyan(json.dumps(json.loads(r.text), indent=2) + "\n")
        print_green(
            f"Update took {bold(round(time.perf_counter() - start_time, 1))} seconds to complete!\n"
        )
    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
        print_red("Update failed!\n")


# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    if check_connection():
        make_request(gather_input())
