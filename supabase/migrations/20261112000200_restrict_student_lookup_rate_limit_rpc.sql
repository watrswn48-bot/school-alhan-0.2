-- The lookup rate-limit RPC is server-only; public clients must not be able
-- to consume arbitrary IP-hash buckets or write to the private attempt table.
REVOKE ALL ON FUNCTION public.consume_student_lookup_attempt(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_student_lookup_attempt(text) TO service_role;
