-- ============================================================
-- 国核设备廉江项目 - 质量问题反馈系统 Supabase 初始化 SQL
-- 在 Supabase Dashboard -> SQL Editor 中执行此脚本
-- ============================================================

-- 1. 创建问卷提交表
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_location TEXT NOT NULL,
    problem_content TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.submissions IS '员工提交的质量问题反馈';
COMMENT ON COLUMN public.submissions.time_location IS '时间与地点（必填）';
COMMENT ON COLUMN public.submissions.problem_content IS '问题具体内容（必填）';
COMMENT ON COLUMN public.submissions.phone IS '联系电话（选填）';

-- 2. 创建查看记录表（记录哪些管理员在什么时候查看了哪条数据）
CREATE TABLE IF NOT EXISTS public.view_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL,
    admin_username TEXT NOT NULL,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.view_records IS '管理员查看记录';

-- 为 view_records 创建复合唯一索引，防止同一管理员重复查看同一提交
CREATE UNIQUE INDEX IF NOT EXISTS view_records_submission_admin_idx
    ON public.view_records (submission_id, admin_id);

-- 为 submissions 创建按时间排序的索引
CREATE INDEX IF NOT EXISTS submissions_created_at_idx
    ON public.submissions (created_at DESC);

-- ============================================================
-- 启用行级安全 (RLS)
-- ============================================================
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_records ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- submissions 表 RLS 策略
-- ============================================================

-- 允许匿名用户（员工端）INSERT
DROP POLICY IF EXISTS "Allow anon insert" ON public.submissions;
CREATE POLICY "Allow anon insert"
    ON public.submissions
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- 允许服务端角色 INSERT（双重保险）
DROP POLICY IF EXISTS "Allow service role insert" ON public.submissions;
CREATE POLICY "Allow service role insert"
    ON public.submissions
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- 只有已认证用户可以 SELECT（管理员登录后才能查看）
DROP POLICY IF EXISTS "Allow authenticated select" ON public.submissions;
CREATE POLICY "Allow authenticated select"
    ON public.submissions
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================
-- view_records 表 RLS 策略
-- ============================================================

-- 只有已认证用户可以 INSERT 查看记录
DROP POLICY IF EXISTS "Allow authenticated insert view" ON public.view_records;
CREATE POLICY "Allow authenticated insert view"
    ON public.view_records
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 只有已认证用户可以 SELECT 查看记录
DROP POLICY IF EXISTS "Allow authenticated select view" ON public.view_records;
CREATE POLICY "Allow authenticated select view"
    ON public.view_records
    FOR SELECT
    TO authenticated
    USING (true);
