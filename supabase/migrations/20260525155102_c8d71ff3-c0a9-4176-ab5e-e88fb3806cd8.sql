
CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lang text NOT NULL,
  level cefr_level NOT NULL,
  order_index int NOT NULL,
  title text NOT NULL,
  summary text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  exam jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lang, level, order_index)
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read lessons" ON public.lessons FOR SELECT TO authenticated USING (true);

CREATE TABLE public.lesson_progress (
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  total int NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lesson progress" ON public.lesson_progress
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_lessons_lang_level ON public.lessons(lang, level, order_index);
