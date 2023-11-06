from colorama import Fore, Style
import json
import os
import requests
import sys
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

# Lists
COLLECTIONS = [ABILITIES, BATTLES, GROUPS, ITEMS, MOVES, POKEMON, TRAINERS, CLEAR]

# Check if server is reachable
try:
    page = requests.get(SERVER_URL)
except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
    print(f"{Fore.RED}The server is unreachable{Style.RESET_ALL}\n")
    sys.exit()

# Inputs
selection = None
toggled = None
toggles = [False] * len(COLLECTIONS)
start = None
end = None
battles_group = None
segments_group = None

# Gather input
while selection != "":
    os.system("cls" if os.name == "nt" else "clear")

    # Print list of options
    for idx, collection in enumerate(COLLECTIONS):
        print(
            f"{Fore.GREEN if toggles[idx] else Fore.RED}({collection[0].capitalize()}) {collection.capitalize()}\t[{'✓' if toggles[idx] else ' '}]{Style.RESET_ALL}"
        )
    print()

    # Print status
    if selection != None and toggled == None:
        print(f"{Fore.RED}Invalid input{Style.RESET_ALL}")
    elif toggled != None:
        print(f"{Fore.YELLOW}{toggled.capitalize()} was toggled{Style.RESET_ALL}")

    # Prompt input
    toggled = None
    selection = (
        input("Pick a field # to toggle or leave empty to run the update: ")
        .strip()
        .lower()
    )

    # Toggle selection
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
                    battles_group = input("Pick a group to parse: ")
                    if battles_group not in VALID_GROUPS:
                        break
                if collection == GROUPS:
                    segments_group = input("Pick a group to update: ")
                    if segments_group not in VALID_GROUPS:
                        break
            toggles[idx] = not toggles[idx]
            toggled = collection
            break

# Construct query
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

query = SERVER_URL + "?" + "&".join(params)
print()

# Make request
os.system("cls" if os.name == "nt" else "clear")
start_time = time.perf_counter()
print(f"{Fore.YELLOW}{Style.BRIGHT}Running update...{Style.RESET_ALL}\n")
try:
    r = requests.get(query)
    print(f"{Fore.CYAN}{json.dumps(json.loads(r.text), indent=2)}{Style.RESET_ALL}\n")
    print(
        f"{Fore.GREEN}Update took {Style.BRIGHT}{round(time.perf_counter() - start_time, 1)}{Style.NORMAL} seconds to complete!{Style.RESET_ALL}\n"
    )
except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
    print(f"{Fore.RED}Update failed!{Style.RESET_ALL}\n")
