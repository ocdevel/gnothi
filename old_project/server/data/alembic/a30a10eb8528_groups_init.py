from alembic import op, context
import sqlalchemy as sa

def migrate_shares(bind, sess):
    op.add_column('shares', sa.Column('username', sa.Boolean(), server_default='true', nullable=True))
    # add email after dropping it first
    op.add_column('shares', sa.Column('first_name', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('shares', sa.Column('last_name', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('shares', sa.Column('bio', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('shares', sa.Column('people', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('shares', sa.Column('gender', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('shares', sa.Column('orientation', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('shares', sa.Column('birthday', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('shares', sa.Column('timezone', sa.Boolean(), server_default='false', nullable=True))
    op.add_column('shares', sa.Column('created_at', sa.TIMESTAMP(timezone=True), index=True, server_default='now()'))

    bind.execute(f"""
    with shares_ as (
        select u.id as obj_id, s.id as share_id  
        from users u 
        inner join shares s 
            on lower(s.email)=lower(u.email)
    )
    insert into shares_users (share_id, obj_id)
    select s.share_id, s.obj_id from shares_ s
    """)
    
    op.drop_index('ix_shares_email', table_name='shares')
    op.drop_index('ix_shares_last_seen', table_name='shares')
    op.drop_column('shares', 'email')
    op.drop_column('shares', 'last_seen')
    op.drop_column('shares', 'new_entries')
    op.drop_column('shares', 'profile')
    op.add_column('shares', sa.Column('email', sa.Boolean(), server_default='false', nullable=True))


