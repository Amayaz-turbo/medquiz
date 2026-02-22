BEGIN;

-- National-level specialty seed for avatar choice at Interne+ stage.
INSERT INTO medical_specialties (id, code, name, is_active)
VALUES
  ('71000000-0000-7000-8000-000000000001', 'medecine_generale', 'Medecine generale', TRUE),
  ('71000000-0000-7000-8000-000000000002', 'anesthesie_reanimation', 'Anesthesie-reanimation', TRUE),
  ('71000000-0000-7000-8000-000000000003', 'cardiologie', 'Cardiologie', TRUE),
  ('71000000-0000-7000-8000-000000000004', 'dermatologie', 'Dermatologie', TRUE),
  ('71000000-0000-7000-8000-000000000005', 'endocrinologie', 'Endocrinologie', TRUE),
  ('71000000-0000-7000-8000-000000000006', 'gastro_enterologie', 'Gastro-enterologie', TRUE),
  ('71000000-0000-7000-8000-000000000007', 'gynecologie_obstetrique', 'Gynecologie-obstetrique', TRUE),
  ('71000000-0000-7000-8000-000000000008', 'hematologie', 'Hematologie', TRUE),
  ('71000000-0000-7000-8000-000000000009', 'medecine_interne', 'Medecine interne', TRUE),
  ('71000000-0000-7000-8000-000000000010', 'nephrologie', 'Nephrologie', TRUE),
  ('71000000-0000-7000-8000-000000000011', 'neurologie', 'Neurologie', TRUE),
  ('71000000-0000-7000-8000-000000000012', 'ophtalmologie', 'Ophtalmologie', TRUE),
  ('71000000-0000-7000-8000-000000000013', 'orl', 'Oto-rhino-laryngologie', TRUE),
  ('71000000-0000-7000-8000-000000000014', 'pediatrie', 'Pediatrie', TRUE),
  ('71000000-0000-7000-8000-000000000015', 'pneumologie', 'Pneumologie', TRUE),
  ('71000000-0000-7000-8000-000000000016', 'psychiatrie', 'Psychiatrie', TRUE),
  ('71000000-0000-7000-8000-000000000017', 'radiologie', 'Radiologie', TRUE),
  ('71000000-0000-7000-8000-000000000018', 'rhumatologie', 'Rhumatologie', TRUE),
  ('71000000-0000-7000-8000-000000000019', 'chirurgie_orthopedique', 'Chirurgie orthopedique', TRUE),
  ('71000000-0000-7000-8000-000000000020', 'chirurgie_viscerale', 'Chirurgie viscerale', TRUE),
  ('71000000-0000-7000-8000-000000000021', 'urgences', 'Medecine d urgences', TRUE)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active;

COMMIT;
