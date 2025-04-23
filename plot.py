import requests
import matplotlib.pyplot as plt
from datetime import datetime

# Fetch the data from the provided URL
url = "https://slack.mybot.saahild.com/shipwreck-data.json"
response = requests.get(url)
data = response.json()

# Convert date strings to datetime objects and extract count values
dates = [datetime.fromisoformat(entry["date"].replace("Z", "+00:00")) for entry in data]
counts = [entry["count"] for entry in data]

# Plot the graph
plt.figure(figsize=(12, 6))
plt.plot(dates, counts, marker='o', linestyle='-', color='blue')
plt.title("RSVP sign ups over time")
plt.xlabel("Date")
plt.ylabel("Count")
plt.grid(True)
plt.tight_layout()

# Save the graph as an image
image_path = "./count_over_time_from_url.png"
plt.savefig(image_path)
plt.close()

image_path
