-- Chain Links: tracks which sale progressions are linked in a property chain
CREATE TABLE IF NOT EXISTS chain_links (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upstream_progression_id   uuid NOT NULL REFERENCES agent_sale_progressions(id) ON DELETE CASCADE,
  downstream_progression_id uuid NOT NULL REFERENCES agent_sale_progressions(id) ON DELETE CASCADE,
  position_in_chain         int NOT NULL DEFAULT 1,
  chain_group_id            uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chain_links_no_self_link CHECK (upstream_progression_id != downstream_progression_id),
  CONSTRAINT chain_links_unique_pair UNIQUE (upstream_progression_id, downstream_progression_id)
);

CREATE INDEX idx_chain_links_upstream ON chain_links(upstream_progression_id);
CREATE INDEX idx_chain_links_downstream ON chain_links(downstream_progression_id);
CREATE INDEX idx_chain_links_group ON chain_links(chain_group_id);

-- Pre-computed chain risk scores (one per sale progression in a chain)
CREATE TABLE IF NOT EXISTS chain_risk_scores (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  progression_id    uuid NOT NULL REFERENCES agent_sale_progressions(id) ON DELETE CASCADE,
  chain_group_id    uuid NOT NULL,
  risk_level        text NOT NULL DEFAULT 'low'
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score        int NOT NULL DEFAULT 0,
  chain_length      int NOT NULL DEFAULT 1,
  chain_position    int NOT NULL DEFAULT 1,
  slowest_link_id   uuid REFERENCES agent_sale_progressions(id),
  slowest_link_days int DEFAULT 0,
  factors           jsonb NOT NULL DEFAULT '[]'::jsonb,
  computed_at       timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chain_risk_scores_unique_progression UNIQUE (progression_id)
);

CREATE INDEX idx_chain_risk_scores_progression ON chain_risk_scores(progression_id);
CREATE INDEX idx_chain_risk_scores_group ON chain_risk_scores(chain_group_id);
CREATE INDEX idx_chain_risk_scores_level ON chain_risk_scores(risk_level);

-- RLS
ALTER TABLE chain_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_read_own_chain_links" ON chain_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agent_sale_progressions asp
      WHERE asp.agent_id = auth.uid()
        AND (asp.id = chain_links.upstream_progression_id
             OR asp.id = chain_links.downstream_progression_id)
    )
  );

CREATE POLICY "agent_insert_own_chain_links" ON chain_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agent_sale_progressions asp
      WHERE asp.agent_id = auth.uid()
        AND (asp.id = chain_links.upstream_progression_id
             OR asp.id = chain_links.downstream_progression_id)
    )
  );

CREATE POLICY "agent_delete_own_chain_links" ON chain_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM agent_sale_progressions asp
      WHERE asp.agent_id = auth.uid()
        AND (asp.id = chain_links.upstream_progression_id
             OR asp.id = chain_links.downstream_progression_id)
    )
  );

CREATE POLICY "agent_read_own_risk_scores" ON chain_risk_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agent_sale_progressions asp
      WHERE asp.agent_id = auth.uid()
        AND asp.id = chain_risk_scores.progression_id
    )
  );

-- Updated-at triggers
CREATE TRIGGER chain_links_updated_at
  BEFORE UPDATE ON chain_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER chain_risk_scores_updated_at
  BEFORE UPDATE ON chain_risk_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
