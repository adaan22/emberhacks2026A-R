import json
import copy
import random

INPUT_FILE = "campus_data.json"
OUTPUT_FILE = "campus_data_estimated.json"

DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]

# -----------------------------
# Location Type Detection
# -----------------------------

def detect_type(name):

    name = name.lower()

    if any(x in name for x in ["subway","tim hortons","coffee","grill","sushi","food","chef","den","lounge","starbucks","opa","dining"]):
        return "food"

    if any(x in name for x in ["library","commons","study"]):
        return "library"

    if any(x in name for x in ["gym","oval","active living","kinesiology"]):
        return "gym"

    if any(x in name for x in ["science","engineering","faculty","building","hall","ict","math","arts"]):
        return "academic"

    return "other"


# -----------------------------
# Hour Template
# -----------------------------

HOURS = [
"6 AM","7 AM","8 AM","9 AM","10 AM","11 AM",
"12 PM","1 PM","2 PM","3 PM","4 PM","5 PM",
"6 PM","7 PM","8 PM","9 PM","10 PM","11 PM"
]


# -----------------------------
# Pattern Generators
# -----------------------------

def pattern_food():

    base = {
        "6 AM":0,"7 AM":20,"8 AM":30,"9 AM":40,
        "10 AM":50,"11 AM":70,"12 PM":95,"1 PM":90,
        "2 PM":70,"3 PM":60,"4 PM":55,"5 PM":65,
        "6 PM":60,"7 PM":40,"8 PM":20
    }

    return add_noise(base)


def pattern_library():

    base = {
        "6 AM":0,"7 AM":10,"8 AM":20,"9 AM":30,
        "10 AM":40,"11 AM":55,"12 PM":65,"1 PM":70,
        "2 PM":75,"3 PM":80,"4 PM":85,"5 PM":90,
        "6 PM":95,"7 PM":90,"8 PM":80
    }

    return add_noise(base)


def pattern_academic():

    base = {
        "6 AM":0,"7 AM":20,"8 AM":50,"9 AM":70,
        "10 AM":75,"11 AM":80,"12 PM":85,"1 PM":80,
        "2 PM":70,"3 PM":60,"4 PM":50,"5 PM":40,
        "6 PM":30,"7 PM":20,"8 PM":10
    }

    return add_noise(base)


def pattern_gym():

    base = {
        "6 AM":20,"7 AM":30,"8 AM":25,"9 AM":20,
        "10 AM":15,"11 AM":20,"12 PM":30,"1 PM":40,
        "2 PM":45,"3 PM":55,"4 PM":65,"5 PM":80,
        "6 PM":95,"7 PM":90,"8 PM":75
    }

    return add_noise(base)


def pattern_other():

    base = {
        "6 AM":0,"7 AM":10,"8 AM":25,"9 AM":40,
        "10 AM":50,"11 AM":55,"12 PM":60,"1 PM":55,
        "2 PM":50,"3 PM":45,"4 PM":40,"5 PM":35,
        "6 PM":25,"7 PM":20,"8 PM":10
    }

    return add_noise(base)


# -----------------------------
# Noise generator
# -----------------------------

def add_noise(base):

    result = {}

    for hour in HOURS:

        score = base.get(hour,0)

        score += random.randint(-5,5)

        score = max(0,min(100,score))

        result[hour] = score

    return result


# -----------------------------
# Generate popular_times
# -----------------------------

def generate_popular_times(place_type):

    generators = {
        "food":pattern_food,
        "library":pattern_library,
        "academic":pattern_academic,
        "gym":pattern_gym,
        "other":pattern_other
    }

    graph_results = {}

    for day in DAYS:

        pattern = generators[place_type]()

        graph_results[day] = []

        for hour in HOURS:

            graph_results[day].append({
                "time":hour,
                "busyness_score":pattern[hour]
            })

    return {
        "current_day":"monday",
        "live_hash":{"info":"Estimated data"},
        "graph_results":graph_results
    }


# -----------------------------
# Main
# -----------------------------

def main():

    with open(INPUT_FILE) as f:
        data = json.load(f)

    for name,info in data.items():

        if info["popular_times"] is None:

            place_type = detect_type(name)

            info["popular_times"] = generate_popular_times(place_type)

            print(f"Estimated {name} ({place_type})")

    with open(OUTPUT_FILE,"w") as f:
        json.dump(data,f,indent=2)

    print("\nDone.")
    print("Output saved to:",OUTPUT_FILE)


if __name__ == "__main__":
    main()