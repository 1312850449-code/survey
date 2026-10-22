"use client";

import { useState } from "react";

type FormData = {
  timeLocation: string;
  problemContent: string;
  phone: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function SurveyForm() {
  const [form, setForm] = useState<FormData>({
    timeLocation: "",
    problemContent: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!form.timeLocation.trim()) {
      nextErrors.timeLocation = "请填写时间与地点";
    }
    if (!form.problemContent.trim()) {
      nextErrors.problemContent = "请描述问题具体内容";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time_location: form.timeLocation.trim(),
          problem_content: form.problemContent.trim(),
          phone: form.phone.trim() || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setForm({ timeLocation: "", problemContent: "", phone: "" });
      } else {
        alert("提交失败，请稍后重试");
      }
    } catch {
      alert("网络错误，请检查后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (success) {
    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-800">提交成功！</h3>
        <p className="text-slate-500 mt-2">感谢您的反馈，项目部将尽快核实处理</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 px-6 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
        >
          继续提交
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          时间与地点 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="timeLocation"
          value={form.timeLocation}
          onChange={handleChange}
          placeholder="例如：2025-01-15 上午 10点，1号机组主厂房3层"
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
            errors.timeLocation ? "border-red-400" : "border-slate-300"
          }`}
        />
        {errors.timeLocation && (
          <p className="text-red-500 text-xs mt-1">{errors.timeLocation}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          问题具体内容 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="problemContent"
          value={form.problemContent}
          onChange={handleChange}
          rows={5}
          placeholder="请详细描述您发现的质量问题..."
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none ${
            errors.problemContent ? "border-red-400" : "border-slate-300"
          }`}
        />
        {errors.problemContent && (
          <p className="text-red-500 text-xs mt-1">{errors.problemContent}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          联系电话 <span className="text-slate-400 font-normal">（选填）</span>
        </label>
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="方便我们核实后联系您"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "提交中..." : "提交反馈"}
      </button>
    </form>
  );
}
