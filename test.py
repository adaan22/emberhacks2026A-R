"""
UCalgary Campus Busyness Data Collector
----------------------------------------
SETUP:
  1. Sign up for a free SerpApi account at https://serpapi.com (no credit card needed)
  2. Copy your API key from https://serpapi.com/manage-api-key
  3. Paste it below where it says YOUR_API_KEY_HERE
  4. Run: pip install requests
  5. Run: python collect_campus_data.py
  6. Output saved to: campus_data.json
"""

import requests
import json
import time

API_KEY = "9ed5818b482bea32e1ef2f91bb47dd567c95f3bbba957ee30fc29814f87e7854"  # <-- PASTE YOUR SERPAPI KEY HERE

LOCATIONS = {
    # ── MacEwan Hall / MSC Food ──────────────────────────────────────────────
    "Noodle & Grill Express":           "ChIJiXHyhgtvcVMRcFmFfnHEd-A",
    "Bake Chef Co.":                    "ChIJi6zpIQlvcVMRvWnXBJB7WkU",
    "Umi Sushi Express":                "ChIJ7UPutAlvcVMR0ZAoClqwJ6I",
    "OPA! of Greece":                   "ChIJiXHyhgtvcVMRNmbv97YsyW0",
    "A&W Canada":                       "ChIJgSlW1ghvcVMR6_sZP748Iyw",
    "Subway":                           "ChIJiXHyhgtvcVMR_EQlo5daBd8",
    "Tim Hortons (MacHall)":            "ChIJsfV7TQlvcVMRNCHfNldU7js",
    "Starbucks (MacEwan)":              "ChIJt-Yp2AhvcVMRHiSbCxvWA6o",
    "Last Defence Lounge":              "ChIJiXHyhgtvcVMRejg1ONFNc2o",
    "The Den":                          "ChIJiXHyhgtvcVMRzdHFH85O-Ks",
    "UCalgary Dining Centre":           "ChIJcUAbfghvcVMRaCMMNhy8wRE",
    "Haskayne Food Hall":               "ChIJ2f70cZ5vcVMRJtn6A3HKHck",
    "Good Earth Coffeehouse (TFDL)":    "ChIJ7UPutAlvcVMRR5c2jyYNwVI",
    "Good Earth Coffeehouse (ICT)":     "ChIJk8pOAAxvcVMRoGrQFturZCk",

    # ── Faculty / Academic Buildings ─────────────────────────────────────────
    "Schulich School of Engineering":   "ChIJl2lh6w5vcVMRe7-2mU3AWs4",
    "EEEL Building":                    "ChIJC_QdIQxvcVMR-zT0yQW-8eA",
    "ICT Building":                     "ChIJT4ox6w5vcVMRZiOpVJka3KA",
    "CCIT Building":                    "ChIJI8bm4w5vcVMRHHp0hvGmpME",
    "Haskayne School of Business":      "ChIJ4XWmSwhvcVMRrZv_6QG898c",
    "Scurfield Hall":                   "ChIJN4yyMApvcVMRX2QTDorfOQU",
    "Faculty of Law":                   "ChIJ4XWmSwhvcVMRLvMRhqZnLbM",
    "Murray Fraser Hall":               "ChIJvSv8dAlvcVMR11vBQzKBSS0",
    "Faculty of Arts":                  "ChIJOTIp6QtvcVMRrcZ3mgcE_Rs",
    "Arts Building":                    "ChIJFdCuCgBvcVMRkXrQRPLgk98",
    "Education Classroom Building":     "ChIJP06NhQlvcVMRJ746togt1r4",
    "Education Tower":                  "ChIJ2bLcBQBvcVMRh9WoNtwFvbI",
    "SAPL (Architecture & Planning)":   "ChIJtZe7fwlvcVMRSUI2VTD0tDA",
    "Cumming School of Medicine":       "ChIJ__-_pK5vcVMRP8meg3M1_7E",
    "Health Sciences Centre":           "ChIJ95jjpq5vcVMRxGhdJh8V0fQ",
    "Faculty of Nursing":               "ChIJpc5uFTRvcVMRwD9scK5zP4w",
    "Faculty of Social Work":           "ChIJL9YQ9ghvcVMRoWCHAKPCI9k",
    "Kinesiology Building":             "ChIJg_3_uAhvcVMRgNgdGJViVIQ",
    "Professional Faculties Building":  "ChIJGQZOfwlvcVMR_sWz5Ga7wZ8",
    "Biological Sciences":              "ChIJC7z5hAtvcVMRy9_O-IMfIhc",
    "Science A":                        "ChIJ9YxDWAlvcVMRgxg7ywOQYnY",
    "Science B":                        "ChIJVVWVTQlvcVMRMgWGUhsDsVo",
    "Math Sciences Building":           "ChIJHYaRBwxvcVMRVVvPYKPmq1g",
    "Earth Sciences Building":          "ChIJKS6zEgxvcVMRrEvA8OWQjH0",
    "Social Sciences Building":         "ChIJ1dhm7wtvcVMR2OW-cU4pYHo",
    "Administration Building":          "ChIJh0_V3gtvcVMRwkWUPaRC_Q8",
    "MacKimmie Tower":                  "ChIJiXHyhgtvcVMR16iff5ezbpA",

    # ── Study Areas & Libraries ──────────────────────────────────────────────
    "Taylor Family Digital Library":    "ChIJ4ahvBQlvcVMRXhQo70mP-Xw",
    "Business Library":                 "ChIJaajhNgpvcVMRA7YqXSQWONQ",
    "Hunter Student Commons":           "ChIJ780515hvcVMRYxBkiLmTqq8",
    "MacEwan Student Centre":           "ChIJt89R2AhvcVMRzsgfA6NReTI",
    "Students Union Clubs Rooms":       "ChIJmdle1whvcVMR0G_KRyk29P8",

    # ── Recreation & Other ───────────────────────────────────────────────────
    "Active Living (Gym)":              "ChIJy2SruAhvcVMRSvyc-w0HRes",
    "Olympic Oval":                     "ChIJiXHyhgtvcVMRuVVF3GEwtR4",
    "Rozsa Centre":                     "ChIJ6xJC9ghvcVMRJVJ-ZrDCwRc",
    "UCalgary Bookstore":               "ChIJuyVh1ghvcVMRhcoL28lB_eg",
}


def fetch_popular_times(name, place_id):
    print(f"  Fetching: {name}...")
    try:
        response = requests.get(
            "https://serpapi.com/search",
            params={
                "engine":   "google_maps",
                "place_id": place_id,
                "api_key":  API_KEY,
            },
            timeout=15,
        )
        data = response.json()

        place = data.get("place_results", {})
        coords = place.get("gps_coordinates", {})
        popular_times = place.get("popular_times", None)

        return {
            "place_id":    place_id,
            "coordinates": {
                "lat": coords.get("latitude"),
                "lng": coords.get("longitude"),
            },
            "popular_times": popular_times,  # None if Google has no data for this location
        }

    except Exception as e:
        print(f"    ERROR fetching {name}: {e}")
        return {
            "place_id":      place_id,
            "coordinates":   {"lat": None, "lng": None},
            "popular_times": None,
            "error":         str(e),
        }


def main():
    print(f"\nCollecting data for {len(LOCATIONS)} locations...\n")

    campus_data = {}
    failed = []

    for name, place_id in LOCATIONS.items():
        result = fetch_popular_times(name, place_id)
        campus_data[name] = result

        if result.get("popular_times") is None:
            failed.append(name)

        time.sleep(0.5)  # be polite to the API

    # Save full output
    with open("campus_data.json", "w") as f:
        json.dump(campus_data, f, indent=2)

    print(f"\nDone! Saved to campus_data.json")
    print(f"  Successful: {len(LOCATIONS) - len(failed)}/{len(LOCATIONS)}")

    if failed:
        print(f"\n  No popular_times data found for:")
        for name in failed:
            print(f"    - {name}  (Google may not have data for this location)")
        print("\n  Tip: For these locations, you can manually add historical")
        print("  busyness arrays or skip them in your heatmap.")


if __name__ == "__main__":
    main()