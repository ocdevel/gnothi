from common.database import init_db, shutdown_db, SessLocal
import common.models as M

def migrate_before(engine):
    sql = f"""
    delete from jobs;
    alter table jobs drop column data;
    """
    engine.execute(sql)

def migrate_after(engine):
    init_db()
    sess = SessLocal.main()
    dt = "'2020-09-05'::timestamp at time zone 'utc'"
    sql = f"""
    update users set created_at={dt}, updated_at={dt};
    update entries set updated_at={dt};
    """
    sess.execute(sql)

    # Cleanup broken entries
    # TODO https://github.com/kvesteri/sqlalchemy-utils/issues/470
    entries = sess.query(M.Entry).with_entities(M.Entry.id, M.Entry.title_summary)
    for entry in entries:
        if entry.title_summary == 'AI server offline, check back later':
            entry.ai_ran = False
    sess.commit()
    shutdown_db()
