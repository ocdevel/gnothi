async function up(db) {
  await db.schema
    .createTable("connections")
    .addColumn("connection_id", "varchar")
    .addColumn("user_id", "varchar")
    .addPrimaryKeyConstraint('connections_pk', ['connection_id', 'user_id'])
    .execute()
}

async function down(db) {
  await db.schema.dropTable("connections").execute()
}

module.exports = { up, down };
