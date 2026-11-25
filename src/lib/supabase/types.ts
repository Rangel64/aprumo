/**
 * PLACEHOLDER escrito à mão a partir de supabase/migrations/20261124230000_0001_schema.sql.
 * Gerado por `pnpm db:types` depois do db push; substituir este arquivo pelo gerado.
 * Colunas text/check são `string` e jsonb é `Json`, como no gerador, para a troca não quebrar o código.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** `Req` = colunas obrigatórias no insert (sem default e não nulas). */
type Insertable<Row, Req extends keyof Row> = { [K in Req]: Row[K] } & {
  [K in Exclude<keyof Row, Req>]?: Row[K];
};

type Table<Row, Req extends keyof Row> = {
  Row: Row;
  Insert: Insertable<Row, Req>;
  Update: Partial<Row>;
  Relationships: [];
};

type ProfilesRow = {
  id: string;
  display_name: string | null;
  is_demo: boolean;
  essay_daily_limit_override: number | null;
  created_at: string;
};
type ContentsRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  subject: string;
  pos_x: number;
  pos_y: number;
  sort: number;
};
type ContentEdgesRow = { from_id: string; to_id: string; kind: string };
type ContentSectionsRow = {
  id: string;
  content_id: string;
  position: number;
  kind: string;
  title: string;
  body_md: string;
  quick_question: Json | null;
  source_citation: string;
  source_url: string | null;
};
type QuestionsRow = {
  id: string;
  content_id: string;
  section_id: string | null;
  stem: string;
  options: Json;
  origin: string;
  source_citation: string;
};
type QuestionKeysRow = { question_id: string; correct_index: number; explanation: string };
type TrailsRow = {
  id: string;
  slug: string;
  name: string;
  objective: string;
  origin: string;
  color: string | null;
};
type TrailContentsRow = { trail_id: string; content_id: string; position: number };
type FlashcardsRow = { id: string; content_id: string; front: string; back: string };
type CompetencyContentsRow = { competency: number; content_id: string; position: number };
type EssayTopicsRow = {
  id: string;
  slug: string;
  title: string;
  motivating_text: string;
  source_citation: string | null;
};
type JourneysRow = {
  id: string;
  user_id: string;
  base_type: string;
  trail_id: string | null;
  goal_type: string;
  goal_description: string;
  deadline: string;
  methodology: string;
  status: string;
  created_at: string;
};
type JourneyContentsRow = {
  journey_id: string;
  content_id: string;
  position: number;
  added_from: string;
};
type AvailabilitySlotsRow = {
  id: string;
  user_id: string;
  weekday: number;
  start_time: string;
  minutes: number;
};
type ScheduleSessionsRow = {
  id: string;
  user_id: string;
  journey_id: string;
  content_id: string;
  starts_at: string;
  minutes: number;
  status: string;
};
type FlashcardStatesRow = {
  user_id: string;
  flashcard_id: string;
  last_rating: number;
  due_on: string;
  reviewed_at: string | null;
};
type EssaySubmissionsRow = {
  id: string;
  user_id: string | null;
  topic_id: string;
  part: string;
  body: string;
  status: string;
  is_example: boolean;
  example_key: string | null;
  created_at: string;
};
type ContentProgressRow = {
  user_id: string;
  content_id: string;
  status: string;
  mastered_at: string | null;
};
type QuizAttemptsRow = {
  id: string;
  user_id: string;
  content_id: string;
  answers: Json;
  correct: number;
  total: number;
  threshold_pct: number;
  passed: boolean;
  created_at: string;
};
type EssayFeedbacksRow = {
  id: string;
  submission_id: string;
  model_key: string;
  prompt_version: string;
  payload: Json;
  total_estimate: number | null;
  latency_ms: number | null;
  created_at: string;
};
type AiUsageRow = {
  id: string;
  user_id: string;
  feature: string;
  status: string;
  usage_date: string;
  model_key: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number;
  submission_id: string | null;
  created_at: string;
};
type AppConfigRow = { key: string; value: Json; updated_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfilesRow, "id">;
      contents: Table<ContentsRow, "slug" | "title" | "summary" | "subject">;
      content_edges: Table<ContentEdgesRow, "from_id" | "to_id" | "kind">;
      content_sections: Table<
        ContentSectionsRow,
        "content_id" | "position" | "kind" | "title" | "body_md" | "source_citation"
      >;
      questions: Table<
        QuestionsRow,
        "content_id" | "stem" | "options" | "origin" | "source_citation"
      >;
      question_keys: Table<QuestionKeysRow, "question_id" | "correct_index" | "explanation">;
      trails: Table<TrailsRow, "slug" | "name" | "objective">;
      trail_contents: Table<TrailContentsRow, "trail_id" | "content_id" | "position">;
      flashcards: Table<FlashcardsRow, "content_id" | "front" | "back">;
      competency_contents: Table<CompetencyContentsRow, "competency" | "content_id">;
      essay_topics: Table<EssayTopicsRow, "slug" | "title" | "motivating_text">;
      journeys: Table<
        JourneysRow,
        "user_id" | "base_type" | "goal_description" | "deadline"
      >;
      journey_contents: Table<
        JourneyContentsRow,
        "journey_id" | "content_id" | "position" | "added_from"
      >;
      availability_slots: Table<
        AvailabilitySlotsRow,
        "user_id" | "weekday" | "start_time" | "minutes"
      >;
      schedule_sessions: Table<
        ScheduleSessionsRow,
        "user_id" | "journey_id" | "content_id" | "starts_at" | "minutes"
      >;
      flashcard_states: Table<
        FlashcardStatesRow,
        "user_id" | "flashcard_id" | "last_rating" | "due_on"
      >;
      essay_submissions: Table<EssaySubmissionsRow, "topic_id" | "part" | "body">;
      content_progress: Table<ContentProgressRow, "user_id" | "content_id" | "status">;
      quiz_attempts: Table<
        QuizAttemptsRow,
        "user_id" | "content_id" | "answers" | "correct" | "total" | "threshold_pct" | "passed"
      >;
      essay_feedbacks: Table<
        EssayFeedbacksRow,
        "submission_id" | "model_key" | "prompt_version" | "payload"
      >;
      ai_usage: Table<AiUsageRow, "user_id" | "feature" | "status">;
      app_config: Table<AppConfigRow, "key" | "value">;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
