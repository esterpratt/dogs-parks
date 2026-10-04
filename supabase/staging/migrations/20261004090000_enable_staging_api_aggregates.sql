-- Staging needs the same Data API aggregate support as production for the
-- existing reviews rank.avg() query. RLS and function grants stay unchanged.
ALTER ROLE authenticator SET pgrst.db_aggregates_enabled = 'true';
NOTIFY pgrst, 'reload config';
