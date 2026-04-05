-- FinCoach AI - Database Schema
-- Run this in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Paste -> Run

-- ============================================================
-- Table: categories
-- System defaults (is_default=true, user_id=NULL) visible to all.
-- User-custom categories have user_id set.
-- ============================================================
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    emoji VARCHAR(10) NOT NULL,
    color_hex CHAR(7) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Table: transactions
-- Core financial data. Each transaction belongs to one user.
-- ============================================================
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL,
    description VARCHAR(255) NOT NULL,
    merchant_name VARCHAR(100),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    confidence_score VARCHAR(10) CHECK (confidence_score IN ('high', 'medium', 'low')),
    payment_method VARCHAR(20) CHECK (payment_method IN ('credito', 'debito', 'pix', 'dinheiro', 'transferencia')),
    is_recurring BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Table: budgets
-- Monthly spending limits per category per user.
-- ============================================================
CREATE TABLE budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    monthly_limit DECIMAL(12,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, category_id)
);

-- ============================================================
-- Table: goals
-- Financial goals with target amounts and deadlines.
-- ============================================================
CREATE TABLE goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) DEFAULT 0,
    deadline DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Categories: default categories visible to all, custom ones per-user
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_visible" ON categories
    FOR SELECT USING (is_default = true OR auth.uid() = user_id);

CREATE POLICY "categories_insert_own" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "categories_update_own" ON categories
    FOR UPDATE USING (auth.uid() = user_id AND is_default = false)
    WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "categories_delete_own" ON categories
    FOR DELETE USING (auth.uid() = user_id AND is_default = false);

-- Transactions: strict per-user isolation
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select_own" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own" ON transactions
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Budgets: strict per-user isolation
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select_own" ON budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budgets_insert_own" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_update_own" ON budgets
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_delete_own" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- Goals: strict per-user isolation
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select_own" ON goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "goals_insert_own" ON goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_update_own" ON goals
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_delete_own" ON goals
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
