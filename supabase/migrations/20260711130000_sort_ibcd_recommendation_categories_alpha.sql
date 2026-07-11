-- Re-sort IBCD counseling recommendation categories A→Z by name.
-- Needed for databases that already applied 20260711120000 with topic-list order;
-- fresh installs get alphabetical display_order from the updated seed migration.

UPDATE public.memorization_recommendation_categories AS c
SET display_order = v.display_order
FROM (
  VALUES
    ('Abuse', 10),
    ('Addictions', 20),
    ('Anger', 30),
    ('Assurance of Salvation', 40),
    ('Child Training', 50),
    ('Church Involvement', 60),
    ('Communication', 70),
    ('Conflict Resolution', 80),
    ('Decision Making', 90),
    ('Depression', 100),
    ('Divorce', 110),
    ('Facing Trials and Calamity', 120),
    ('Fear', 130),
    ('Finances', 140),
    ('General Principles', 150),
    ('Granting Forgiveness', 160),
    ('Integrity', 170),
    ('Lust', 180),
    ('Marriage', 190),
    ('Presenting the Gospel', 200),
    ('Repentance', 210),
    ('Resisting Temptation', 220),
    ('Revenge', 230),
    ('Sanctification', 240),
    ('Seeking Forgiveness', 250),
    ('Sex', 260),
    ('The Role of the Husband', 270),
    ('The Role of the Wife', 280),
    ('Work and Employment', 290),
    ('Worry', 300)
) AS v(name, display_order)
WHERE c.name = v.name;
