import os, json
import boto3
from store.store import  EntryStore

def upsert(data):
    entry = data['entry']
    store = EntryStore(entry['user_id'])
    return store.add_entry(entry)
