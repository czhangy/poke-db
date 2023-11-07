from colorama import Fore, Style
import json
import os
import requests
import time

# Constants
SERVER_URL = "http://localhost:3000/api/data"
OK = 200
ABILITIES = "abilities"
BATTLES = "battles"
GROUPS = "groups"
ITEMS = "items"
MOVES = "moves"
POKEMON = "pokemon"
TRAINERS = "trainers"
CLEAR = "clear"
VALID_GROUPS = ["ruby_sapphire", "emerald"]
COLLECTIONS = [ABILITIES, BATTLES, GROUPS, ITEMS, MOVES, POKEMON, TRAINERS, CLEAR]


# Functions
def clear_console():
    os.system("cls" if os.name == "nt" else "clear")


def check_connection():
    try:
        requests.get(SERVER_URL)
        return True
    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
        print(f"{Fore.RED}The server is unreachable{Style.RESET_ALL}\n")
        return False


def print_options(toggles):
    for idx, collection in enumerate(COLLECTIONS):
        print(
            f"{Fore.GREEN if toggles[idx] else Fore.RED}({collection[0].capitalize()}) {collection.capitalize()}\t[{'✓' if toggles[idx] else ' '}]{Style.RESET_ALL}"
        )
    print()


def print_status(selection, toggled):
    if selection != None and toggled == None:
        print(f"{Fore.RED}Invalid input{Style.RESET_ALL}")
    elif toggled != None:
        print(f"{Fore.YELLOW}{toggled.capitalize()} was toggled{Style.RESET_ALL}")


def get_selection():
    return (
        input("Pick a field to toggle or leave empty to run the update: ")
        .strip()
        .lower()
    )


def get_group():
    return input("Pick a group to update: ")


def toggle_selection(selection, toggles):
    start = None
    end = None
    battles_group = None
    segments_group = None

    for idx, collection in enumerate(COLLECTIONS):
        if collection[0] == selection:
            if not toggles[idx]:
                if collection == POKEMON:
                    start = input("Start at #: ")
                    if not start.isdigit():
                        break
                    end = input("End at #: ")
                    if not end.isdigit():
                        break
                if collection == BATTLES:
                    battles_group = get_group()
                if collection == GROUPS:
                    segments_group = get_group()
            toggles[idx] = not toggles[idx]
            return collection, start, end, battles_group, segments_group
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

    print()
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
            toggled, start, end, battles_group, segments_group = res

    return construct_query(toggles, start, end, battles_group, segments_group)


def make_request(query):
    clear_console()
    start_time = time.perf_counter()
    print(f"{Fore.YELLOW}{Style.BRIGHT}Running update...{Style.RESET_ALL}\n")
    try:
        r = requests.get(query)
        print(
            f"{Fore.CYAN}{json.dumps(json.loads(r.text), indent=2)}{Style.RESET_ALL}\n"
        )
        print(
            f"{Fore.GREEN}Update took {Style.BRIGHT}{round(time.perf_counter() - start_time, 1)}{Style.NORMAL} seconds to complete!{Style.RESET_ALL}\n"
        )
    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
        print(f"{Fore.RED}Update failed!{Style.RESET_ALL}\n")


# Main
if __name__ == "__main__":
    if check_connection():
        make_request(gather_input())
