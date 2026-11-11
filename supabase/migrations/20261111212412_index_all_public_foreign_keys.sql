DO $$
DECLARE fk record;
DECLARE index_name text;
BEGIN
  FOR fk IN
    SELECT c.conrelid AS table_oid, c.conrelid::regclass AS table_name,
           a.attnum AS column_number, a.attname AS column_name, c.conname AS constraint_name
    FROM pg_constraint c
    JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS key(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = key.attnum
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'f' AND n.nspname = 'public'
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_index i
      WHERE i.indrelid = fk.table_oid AND i.indisvalid AND i.indkey[0] = fk.column_number
    ) THEN
      index_name := left('idx_fk_' || replace(fk.table_name::text, '.', '_') || '_' || fk.column_name, 50)
                    || '_' || substr(md5(fk.constraint_name), 1, 8);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %s (%I)', index_name, fk.table_name, fk.column_name);
    END IF;
  END LOOP;
END $$;
