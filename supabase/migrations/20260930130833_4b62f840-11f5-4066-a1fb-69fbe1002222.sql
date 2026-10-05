CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  video_url TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL,
  duration DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  start_time DOUBLE PRECISION NOT NULL CHECK (start_time >= 0),
  end_time DOUBLE PRECISION NOT NULL CHECK (end_time >= 0),
  comment TEXT NOT NULL CHECK (char_length(btrim(comment)) > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT annotations_range_valid CHECK (end_time > start_time)
);

CREATE INDEX idx_annotations_video_id ON public.annotations(video_id);
CREATE INDEX idx_annotations_video_start ON public.annotations(video_id, start_time);
CREATE INDEX idx_videos_created_at ON public.videos(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO anon, authenticated;
GRANT ALL ON public.videos TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.annotations TO anon, authenticated;
GRANT ALL ON public.annotations TO service_role;

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Videos are publicly readable" ON public.videos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create videos" ON public.videos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update videos" ON public.videos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete videos" ON public.videos FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Annotations are publicly readable" ON public.annotations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create annotations" ON public.annotations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update annotations" ON public.annotations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete annotations" ON public.annotations FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER videos_set_updated_at BEFORE UPDATE ON public.videos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER annotations_set_updated_at BEFORE UPDATE ON public.annotations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();