import json, sys

# Check both general and images
for cat in ["general", "images"]:
    fname = rf"C:\Users\newto\AppData\Local\Temp\searx_{cat}.json"
    try:
        d = json.load(open(fname))
    except:
        print(f"--- {cat} --- (no file)")
        continue

    engines = {}
    for r in d.get("results", []):
        e = r.get("engine", "unknown")
        engines[e] = engines.get(e, 0) + 1

    total = len(d.get("results", []))
    print(f"--- {cat} --- Total: {total}")
    for k, v in sorted(engines.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")

    unresponsive = d.get("unresponsive_engines", [])
    if unresponsive:
        print("  Unresponsive:")
        for u in unresponsive:
            print(f"    {u}")
    print()
