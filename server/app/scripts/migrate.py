from sqlalchemy import create_engine


def migrate(db_url):
    last = "'2020-08-24'::timestamp at time zone 'utc'"
    sql = f"""
    update shares s set last_seen={last}, new_entries=0;
    with news as (
      select s.id, count(e.id) ct 
      from shares s 
      inner join shares_tags st on st.share_id=s.id
      inner join entries_tags et on et.tag_id=st.tag_id
      inner join entries e on e.id=et.entry_id
      where e.created_at > {last}
      group by s.id
    )
    update shares s set new_entries=n.ct from news n where n.id=s.id;
    """
    create_engine(db_url).execute(sql)
