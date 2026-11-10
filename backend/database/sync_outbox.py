import os


def enqueue_sync_event(cursor, entity_type, entity_id, operation="upsert"):
    """Insert a sync event in the caller's existing MySQL transaction.

    Local development skips outbox events because the local database may not
    contain the production sync_outbox table.
    """
    use_cloud = os.getenv("USE_CLOUD_DB", "false").lower() == "true"

    if not use_cloud:
        return

    cursor.execute(
        """
        INSERT INTO sync_outbox
            (Entity_Type, Entity_ID, Operation, Status)
        VALUES (%s, %s, %s, 'pending')
        """,
        (entity_type, entity_id, operation)
    )
