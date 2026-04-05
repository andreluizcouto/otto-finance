-- FinCoach AI - Seed Categories
-- Run this AFTER schema.sql in Supabase SQL Editor
-- Pre-populated Brazilian spending categories with colors and emojis

INSERT INTO categories (name, slug, emoji, color_hex, is_default) VALUES
    ('Alimentacao', 'alimentacao', '🍔', '#EF4444', true),
    ('Transporte', 'transporte', '🚗', '#3B82F6', true),
    ('Moradia', 'moradia', '🏠', '#8B5CF6', true),
    ('Saude', 'saude', '💊', '#22C55E', true),
    ('Lazer', 'lazer', '🎮', '#F59E0B', true),
    ('Educacao', 'educacao', '📚', '#06B6D4', true),
    ('Compras', 'compras', '🛍️', '#EC4899', true),
    ('Assinaturas', 'assinaturas', '🔄', '#6366F1', true),
    ('Delivery', 'delivery', '🚴', '#F97316', true),
    ('Outros', 'outros', '📌', '#64748B', true);
