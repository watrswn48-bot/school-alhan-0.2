CREATE TABLE IF NOT EXISTS public.student_lookup_attempts (
  ip_hash text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT date_trunc('minute',now()),
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_lookup_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_lookup_attempts FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.consume_student_lookup_attempt(p_ip_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public
AS $$
DECLARE allowed boolean;
BEGIN
  INSERT INTO public.student_lookup_attempts(ip_hash,window_started_at,request_count,updated_at)
  VALUES(p_ip_hash,date_trunc('minute',now()),1,now())
  ON CONFLICT(ip_hash) DO UPDATE SET
    window_started_at=CASE WHEN public.student_lookup_attempts.window_started_at<date_trunc('minute',now())
      THEN date_trunc('minute',now()) ELSE public.student_lookup_attempts.window_started_at END,
    request_count=CASE WHEN public.student_lookup_attempts.window_started_at<date_trunc('minute',now())
      THEN 1 ELSE public.student_lookup_attempts.request_count+1 END,
    updated_at=now()
  RETURNING request_count<=12 INTO allowed;
  RETURN allowed;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_student_lookup_attempt(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_student_lookup_attempt(text) TO service_role;
