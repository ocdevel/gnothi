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
    update entries set updated_at={dt}, ai_ran=false;
    """
    sess.execute(sql)

    # ai_ran set to false for everything, to generate paras/clean/vectors
    sess.commit()
    shutdown_db()
