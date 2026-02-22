BEGIN;

-- Guardrails: stage seeds from migration 002 must exist before this catalog seed runs.
DO $$
DECLARE
  v_missing TEXT[];
BEGIN
  SELECT ARRAY_AGG(required_stage.code ORDER BY required_stage.code)
  INTO v_missing
  FROM (
    SELECT code
    FROM (VALUES
      ('pass_las'),
      ('dfgsm2'),
      ('dfgsm3'),
      ('dfasm1'),
      ('dfasm2'),
      ('dfasm3'),
      ('interne'),
      ('docteur_junior')
    ) AS expected(code)
    WHERE NOT EXISTS (
      SELECT 1
      FROM avatar_stages s
      WHERE s.code = expected.code
    )
  ) AS required_stage;

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot seed avatar_items: missing avatar_stages codes: %', array_to_string(v_missing, ', ');
  END IF;
END
$$;

INSERT INTO avatar_items (id, code, name, item_type, rarity, source_type, required_stage_id, is_active)
VALUES
  ('72000000-0000-7000-8000-000000000001', 'object_stethoscope_standard', 'Stethoscope standard', 'object', 'common', 'progression', (SELECT id FROM avatar_stages WHERE code = 'pass_las'), TRUE),
  ('72000000-0000-7000-8000-000000000002', 'object_badge_reussite', 'Badge de reussite', 'object', 'rare', 'rewarded', NULL, TRUE),
  ('72000000-0000-7000-8000-000000000003', 'object_lampe_examen', 'Lampe d examen', 'object', 'rare', 'progression', (SELECT id FROM avatar_stages WHERE code = 'dfgsm3'), TRUE),
  ('72000000-0000-7000-8000-000000000004', 'object_tablette_clinique', 'Tablette clinique', 'object', 'epic', 'event', (SELECT id FROM avatar_stages WHERE code = 'dfasm2'), TRUE),
  ('72000000-0000-7000-8000-000000000005', 'object_mallette_interne', 'Mallette d interne', 'object', 'epic', 'progression', (SELECT id FROM avatar_stages WHERE code = 'interne'), TRUE),

  ('72000000-0000-7000-8000-000000000006', 'pose_etude_focus', 'Pose etude focus', 'pose', 'common', 'progression', (SELECT id FROM avatar_stages WHERE code = 'pass_las'), TRUE),
  ('72000000-0000-7000-8000-000000000007', 'pose_victoire_discrete', 'Pose victoire discrete', 'pose', 'rare', 'rewarded', NULL, TRUE),
  ('72000000-0000-7000-8000-000000000008', 'pose_soutien_patient', 'Pose soutien patient', 'pose', 'rare', 'event', (SELECT id FROM avatar_stages WHERE code = 'dfgsm2'), TRUE),
  ('72000000-0000-7000-8000-000000000009', 'pose_staff_service', 'Pose staff service', 'pose', 'epic', 'progression', (SELECT id FROM avatar_stages WHERE code = 'dfasm3'), TRUE),
  ('72000000-0000-7000-8000-000000000010', 'pose_chef_clinique', 'Pose chef de clinique', 'pose', 'legendary', 'progression', (SELECT id FROM avatar_stages WHERE code = 'docteur_junior'), TRUE),

  ('72000000-0000-7000-8000-000000000011', 'outfit_tenue_pass_las', 'Tenue PASS LAS', 'outfit', 'common', 'progression', (SELECT id FROM avatar_stages WHERE code = 'pass_las'), TRUE),
  ('72000000-0000-7000-8000-000000000012', 'outfit_blouse_dfgsm', 'Blouse DFGSM', 'outfit', 'rare', 'progression', (SELECT id FROM avatar_stages WHERE code = 'dfgsm2'), TRUE),
  ('72000000-0000-7000-8000-000000000013', 'outfit_tenue_garde', 'Tenue de garde', 'outfit', 'rare', 'rewarded', NULL, TRUE),
  ('72000000-0000-7000-8000-000000000014', 'outfit_tenue_bloc', 'Tenue de bloc', 'outfit', 'epic', 'progression', (SELECT id FROM avatar_stages WHERE code = 'interne'), TRUE),
  ('72000000-0000-7000-8000-000000000015', 'outfit_tenue_junior', 'Tenue docteur junior', 'outfit', 'legendary', 'progression', (SELECT id FROM avatar_stages WHERE code = 'docteur_junior'), TRUE),

  ('72000000-0000-7000-8000-000000000016', 'background_bibliotheque', 'Fond bibliotheque', 'background', 'common', 'progression', (SELECT id FROM avatar_stages WHERE code = 'pass_las'), TRUE),
  ('72000000-0000-7000-8000-000000000017', 'background_amphi_historique', 'Fond amphi historique', 'background', 'rare', 'rewarded', NULL, TRUE),
  ('72000000-0000-7000-8000-000000000018', 'background_service_hospitalier', 'Fond service hospitalier', 'background', 'rare', 'progression', (SELECT id FROM avatar_stages WHERE code = 'dfasm1'), TRUE),
  ('72000000-0000-7000-8000-000000000019', 'background_salle_garde', 'Fond salle de garde', 'background', 'epic', 'event', (SELECT id FROM avatar_stages WHERE code = 'interne'), TRUE),
  ('72000000-0000-7000-8000-000000000020', 'background_congres_medical', 'Fond congres medical', 'background', 'legendary', 'progression', (SELECT id FROM avatar_stages WHERE code = 'docteur_junior'), TRUE)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  item_type = EXCLUDED.item_type,
  rarity = EXCLUDED.rarity,
  source_type = EXCLUDED.source_type,
  required_stage_id = EXCLUDED.required_stage_id,
  is_active = EXCLUDED.is_active;

COMMIT;
