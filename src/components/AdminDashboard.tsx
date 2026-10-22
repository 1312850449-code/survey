"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

type Submission = {
  id: string;
  time_location: string;
  problem_content: string;
  phone: string | null;
  created_at: string;
};

type ViewRecord = {
  id: string;
  submission_id: string;
  admin_id: string;
  admin_username: string;
  viewed_at: string;
};

type CurrentUser = { id: string; email: string } | null;

type ExpandedItem = {
  submission: Submission;
  views: ViewRecord[];
  isViewedByMe: boolean;
};

export default function AdminDashboard({
  initialSubmissions,
  initialViewRecords,
  currentUser,
}: {
  initialSubmissions: Submission[];
  initialViewRecords: ViewRecord[];
  currentUser: CurrentUser;
}) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [viewRecords, setViewRecords] = useState<ViewRecord[]>(initialViewRecords);
  const [expanded, setExpanded] = useState<Record<string, ExpandedItem>>({});
  const [loadingView, setLoadingView] = useState<string | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedSubmissions = submissions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleView = useCallback(
    async (submission: Submission) => {
      const existing = expanded[submission.id];

      if (existing) {
        setExpanded((prev) => {
          const next = { ...prev };
          delete next[submission.id];
          return next;
        });
        return;
      }

      setLoadingView(submission.id);

      try {
        const accessToken = document.cookie
          .split(";")
          .find((c) => c.trim().startsWith("sb-access-token="))
          ?.split("=")[1];

        const res = await fetch("/api/view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken || ""}`,
          },
          body: JSON.stringify({
            submission_id: submission.id,
            admin_id: currentUser?.id,
            admin_username: currentUser?.email || "管理员",
          }),
        });

        if (res.ok) {
          const { data: newView } = await res.json();
          if (newView) {
            setViewRecords((prev) => [...prev, newView]);
          }
        }
      } catch (err) {
        console.error("View record error:", err);
      }

      const itemViews = viewRecords.filter(
        (v) => v.submission_id === submission.id
      );
      const isViewedByMe = itemViews.some((v) => v.admin_id === currentUser?.id);

      setExpanded((prev) => ({
        ...prev,
        [submission.id]: {
          submission,
          views: itemViews,
          isViewedByMe,
        },
      }));
      setLoadingView(null);
    },
    [expanded, viewRecords, currentUser]
  );

  const handleDelete = async (submission: Submission) => {
    if (!window.confirm("确定删除这条反馈记录吗？删除后不可恢复。")) return;

    setDeletingId(submission.id);
    try {
      const accessToken = document.cookie
        .split(";")
        .find((c) => c.trim().startsWith("sb-access-token="))
        ?.split("=")[1];

      const res = await fetch("/api/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken || ""}`,
        },
        body: JSON.stringify({ id: submission.id }),
      });

      if (!res.ok) {
        alert("删除失败，请稍后重试");
        return;
      }

      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      setViewRecords((prev) =>
        prev.filter((v) => v.submission_id !== submission.id)
      );
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[submission.id];
        return next;
      });
    } catch {
      alert("网络错误，请稍后重试");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await supabase.auth.signOut();
      document.cookie = "sb-access-token=; path=/; max-age=0";
      document.cookie = "sb-refresh-token=; path=/; max-age=0";
      window.location.href = "/admin/login";
    } finally {
      setLogoutLoading(false);
    }
  };

  const getMyViews = (submissionId: string) =>
    viewRecords.filter(
      (v) => v.submission_id === submissionId && v.admin_id === currentUser?.id
    );

  const getAllViews = (submissionId: string) =>
    viewRecords.filter((v) => v.submission_id === submissionId);

  const unviewedCount = submissions.filter(
    (s) => getMyViews(s.id).length === 0
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              质量问题反馈 · 管理后台
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              国核设备廉江项目 · 当前用户：{currentUser?.email || "未登录"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
          >
            {logoutLoading ? "退出中..." : "退出登录"}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">总提交数</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {submissions.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">我未查看</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {unviewedCount}
            </p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p>暂无提交数据</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pagedSubmissions.map((s) => {
              const myViews = getMyViews(s.id);
              const allViews = getAllViews(s.id);
              const isExpanded = !!expanded[s.id];
              const isLoading = loadingView === s.id;

              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-xl border transition overflow-hidden ${
                    isExpanded
                      ? "border-blue-300 shadow-md"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <button
                    onClick={() => handleView(s)}
                    disabled={isLoading}
                    className="w-full text-left px-4 py-4 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 truncate">
                          {s.time_location}
                        </span>
                        {myViews.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            我已查看
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                            未查看
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {s.problem_content}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(s.created_at).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-slate-500">
                        {allViews.length} 位管理员查看
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-5 h-5 text-slate-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && expanded[s.id] && (
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          详细信息
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div>
                            <span className="text-slate-500">时间与地点：</span>
                            <span className="text-slate-800 font-medium">
                              {s.time_location}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">问题内容：</span>
                            <p className="text-slate-800 mt-1 whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200">
                              {s.problem_content}
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">联系电话：</span>
                            <span className="text-slate-800">
                              {s.phone || "（未填写）"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">提交时间：</span>
                            <span className="text-slate-800">
                              {new Date(s.created_at).toLocaleString("zh-CN")}
                            </span>
                          </div>
                          <div className="pt-1">
                            <button
                              onClick={() => handleDelete(s)}
                              disabled={deletingId === s.id}
                              className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === s.id ? "删除中..." : "删除此反馈"}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                          查看记录（{allViews.length} 人查看）
                        </h4>
                        {allViews.length === 0 ? (
                          <p className="text-sm text-slate-400">暂无管理员查看</p>
                        ) : (
                          <ul className="space-y-1.5">
                            {allViews.map((v) => (
                              <li
                                key={v.id}
                                className="text-sm bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between"
                              >
                                <span className="text-slate-700">
                                  <span className="font-medium">
                                    {v.admin_username}
                                  </span>
                                  {v.admin_id === currentUser?.id && (
                                    <span className="ml-2 text-xs text-blue-600">
                                      （我）
                                    </span>
                                  )}
                                  <span className="ml-2 text-xs text-slate-400">
                                    已查看
                                  </span>
                                </span>
                                <span className="text-xs text-slate-400">
                                  {new Date(v.viewed_at).toLocaleString("zh-CN")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 text-sm rounded-lg border transition ${
                      p === currentPage
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
