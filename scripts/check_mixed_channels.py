
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.local")

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("Error: Supabase credentials not found.")
    exit(1)

supabase = create_client(url, key)

print("Checking for campaigns with mixed channels (Instagram + Blog)...")

# Fetch campaigns that might have both or mismatches
response = supabase.table("campaign").select("id, title, channel, source").ilike("channel", "%인스타%").execute()

count = 0
mixed_count = 0

for item in response.data:
    count += 1
    channels = item.get("channel", "")
    if "블로그" in channels and "인스타" in channels:
        print(f"Mixed: [{item['source']}] {item['title']} -> {channels}")
        mixed_count += 1

print(f"Total Instagram campaigns: {count}")
print(f"Mixed (Insta + Blog) campaigns: {mixed_count}")
