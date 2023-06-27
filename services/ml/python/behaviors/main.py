from behaviors.tableqa import main as tableqa
from behaviors.influencers import main as influencers

def main(event, context):
    if event.get('event', None) == 'tableqa':
        return tableqa(event, context)
    # no else-if currently because Influencers happens on Cron, so event.event isn't available
    else:
        return influencers(event, context)
