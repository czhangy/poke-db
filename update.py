from colorama import Fore, Style
import json
import os
import requests
import signal
import sys
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
def color_red(str):
    return f"{Fore.RED}{str}{Style.RESET_ALL}"


def color_blue(str):
    return f"{Fore.BLUE}{str}{Style.RESET_ALL}"


def color_green(str):
    return f"{Fore.GREEN}{str}{Style.RESET_ALL}"


def color_yellow(str):
    return f"{Fore.YELLOW}{str}{Style.RESET_ALL}"


def color_cyan(str):
    return f"{Fore.CYAN}{str}{Style.RESET_ALL}"


def bold(str):
    return f"{Style.BRIGHT}{str}{Style.NORMAL}"


def clear_console():
    os.system("cls" if os.name == "nt" else "clear")


def get_group_map():
    return {
        "ruby_sapphire": f"{color_red('Ruby')}/{color_blue('Sapphire')}",
        "emerald": color_green("Emerald"),
    }


# ------------------------------------------------------------------------------
# Signal Handler
# ------------------------------------------------------------------------------
def signal_handler(sig, frame):
    print(color_yellow("\n\nExited"))
    sys.exit(0)


# ------------------------------------------------------------------------------
# Check Connection
# ------------------------------------------------------------------------------
def check_connection():
    try:
        requests.get(SERVER_URL)
        return True
    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
        print(color_red("The server is unreachable\n"))
        return False


# ------------------------------------------------------------------------------
# Gather Input
# ------------------------------------------------------------------------------
def print_options(toggles, start, end, battles_group, groups_group):
    groups = get_group_map()
    for idx, collection in enumerate(COLLECTIONS):
        option = f"({collection[0].capitalize()}) {collection.capitalize()}\t"
        subset = None
        if toggles[idx]:
            option += "[✓]"
            if collection == POKEMON:
                subset = f"{start}-{end}"
            elif collection == BATTLES:
                subset = groups[battles_group]
            elif collection == GROUPS:
                subset = groups[groups_group]
            print(
                color_green(option)
                + (f"  {color_green(f'[{subset}]')}" if subset else "")
            )
        else:
            option += "[ ]"
            print(color_red(option))
    print(color_red("(R) Reset\n"))


def print_status(selection, toggled, toggles):
    if selection == RESET:
        print(color_yellow("Selections reset"))
    elif selection != None and toggled == None:
        print(color_red("Invalid input"))
    elif toggled != None:
        print(
            color_yellow(
                f"{toggled.capitalize()} was toggled {'on' if toggles[COLLECTIONS.index(toggled)] else 'off'}"
            )
        )


def get_selection():
    return (
        input("Pick a field to toggle or leave empty to run the update: ")
        .strip()
        .lower()
    )


def print_groups(groups):
    for idx, group in enumerate(groups):
        print(f"({idx + 1}) {group}")
    print()


def get_group():
    groups = get_group_map()
    idx = None
    while idx == None or idx < 1 or idx > len(groups):
        clear_console()
        print_groups(groups.values())
        if idx != None:
            print(color_red("Invalid group #"))
        try:
            idx = int(input("Select a group #: "))
        except:
            idx = -1
    return list(groups.keys())[idx - 1]


def toggle_selection(selection, toggles):
    start = None
    end = None
    battles_group = None
    groups_group = None

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
                    groups_group = get_group()
            return collection, toggles, start, end, battles_group, groups_group
    return None


def construct_query(toggles, start, end, battles_group, groups_group):
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
                params.append(f"groups_group={groups_group}")

    return SERVER_URL + "?" + "&".join(params)


def gather_input():
    selection = None
    toggled = None
    toggles = [False] * len(COLLECTIONS)
    start, end = None, None
    battles_group, groups_group = None, None

    while selection != "":
        clear_console()
        print_options(toggles, start, end, battles_group, groups_group)
        print_status(selection, toggled, toggles)
        selection = get_selection()
        res = toggle_selection(selection, toggles)
        if res:
            toggled = res[0]
            toggles = res[1]
            if res[2] and res[3]:
                start = res[2]
                end = res[3]
            elif res[4]:
                battles_group = res[4]
            elif res[5]:
                groups_group = res[5]

    print()
    return construct_query(toggles, start, end, battles_group, groups_group)


# ------------------------------------------------------------------------------
# Make Request
# ------------------------------------------------------------------------------
def make_request(query):
    clear_console()
    start_time = time.perf_counter()
    print(color_yellow(bold("Running update...")))
    try:
        r = requests.get(query)
        print(color_cyan(json.dumps(json.loads(r.text), indent=2) + "\n"))
        print(
            color_green(
                f"Update took {bold(round(time.perf_counter() - start_time, 1))} seconds to complete!\n"
            )
        )
    except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
        print(color_red("Update failed!\n"))


# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------
if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    if check_connection():
        make_request(gather_input())
    signal.pause()
