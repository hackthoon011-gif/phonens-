CREATE POLICY "Anyone can read video files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'videos');
CREATE POLICY "Anyone can upload video files" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'videos');
CREATE POLICY "Anyone can delete video files" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'videos');