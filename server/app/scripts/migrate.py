def migrate_before(engine):
    sql = f"""
    delete from jobs;
    alter table jobs drop column data;
    """
    engine.execute(sql)

def migrate_after(engine):
    dt = "'2020-09-05'::timestamp at time zone 'utc'"
    sql = f"""
    update users set created_at={dt}, updated_at={dt};
    update entries set updated_at={dt};
    """
    engine.execute(sql)
