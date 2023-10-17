from colorama import Fore, Style
import os
import requests
import sys
import time

# Constants
SERVER_URL = "http://localhost:3000/api/data"
OK = 200
ABILITIES = "abilities"
ITEMS = "items"
MOVES = "moves"
POKEMON = "pokemon"
TRAINERS = "trainers"
CLEAR = "clear"

# Lists
COLLECTIONS = [ABILITIES, ITEMS, MOVES, POKEMON, TRAINERS, CLEAR]
STARTS = [ABILITIES, MOVES, POKEMON, TRAINERS]
ENDS = [POKEMON]

# Check if server is reachable
try:
    page = requests.get(SERVER_URL)
except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
    print(f"{Fore.RED}The server is unreachable{Style.RESET_ALL}\n")
    sys.exit()

# Gather input
selection = None
toggled = None
toggles = [False] * len(COLLECTIONS)
starts = [None] * len(STARTS)
ends = [None] * len(ENDS)
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
                if collection in STARTS:
                    start = input("Start at #: ")
                    if start.isdigit():
                        starts[STARTS.index(collection)] = start
                    else:
                        break
                if collection in ENDS:
                    end = input("End at #: ")
                    if end.isdigit():
                        ends[ENDS.index(collection)] = end
                    else:
                        break
            toggles[idx] = not toggles[idx]
            toggled = collection
            break

# Construct query
params = []
for idx, collection in enumerate(COLLECTIONS):
    if toggles[idx]:
        params.append(f"{collection}=true")
        if collection in STARTS and starts[STARTS.index(collection)]:
            params.append(f"{collection}_start={starts[STARTS.index(collection)]}")
        if collection in ENDS and ends[ENDS.index(collection)]:
            params.append(f"{collection}_end={ends[ENDS.index(collection)]}")

query = SERVER_URL + "?" + "&".join(params)
print()

# Make request
os.system("cls" if os.name == "nt" else "clear")
start_time = time.perf_counter()
print(f"{Fore.YELLOW}{Style.BRIGHT}Running update...{Style.RESET_ALL}\n")
try:
    r = requests.get(query)
    print(f"{Fore.GREEN}{r.json()}")
    print(
        f"Update took {round(time.perf_counter() - start_time, 2)} seconds to complete!{Style.RESET_ALL}\n"
    )
except (requests.exceptions.HTTPError, requests.exceptions.ConnectionError):
    print(f"{Fore.RED}Update failed!{Style.RESET_ALL}\n")
