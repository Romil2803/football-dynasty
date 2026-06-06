import json

with open(r'C:\Users\01\.gemini\antigravity-ide\brain\c9d7f56a-3051-4aec-a926-dee54fc0bfa7\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        if 'USER' in line and 'UPGRADE FOOTBALL DYNASTY' in line:
            obj = json.loads(line)
            print(obj.get('content', ''))
            break
