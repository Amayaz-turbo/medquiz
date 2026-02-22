BEGIN;

-- Seed canonical avatar stages for progression:
-- PASS/LAS -> DFGSM2 -> DFGSM3 -> DFASM1 -> DFASM2 -> DFASM3 -> Interne -> Docteur junior
INSERT INTO avatar_stages (id, code, name, sort_order, is_active)
VALUES
  ('70000000-0000-7000-8000-000000000001', 'pass_las', 'PASS/LAS', 1, TRUE),
  ('70000000-0000-7000-8000-000000000002', 'dfgsm2', 'DFGSM2', 2, TRUE),
  ('70000000-0000-7000-8000-000000000003', 'dfgsm3', 'DFGSM3', 3, TRUE),
  ('70000000-0000-7000-8000-000000000004', 'dfasm1', 'DFASM1', 4, TRUE),
  ('70000000-0000-7000-8000-000000000005', 'dfasm2', 'DFASM2', 5, TRUE),
  ('70000000-0000-7000-8000-000000000006', 'dfasm3', 'DFASM3', 6, TRUE),
  ('70000000-0000-7000-8000-000000000007', 'interne', 'Interne', 7, TRUE),
  ('70000000-0000-7000-8000-000000000008', 'docteur_junior', 'Docteur junior', 8, TRUE)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

COMMIT;
