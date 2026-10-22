import SurveyForm from "@/components/SurveyForm";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              国核设备廉江项目
            </h1>
            <h2 className="text-xl font-semibold text-blue-600 mt-1">
              质量问题反馈直通车
            </h2>
            <p className="text-sm text-slate-500 mt-3">
              请如实填写以下信息，您的反馈将被严肃对待
            </p>
          </div>

          <SurveyForm />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          国核设备 · 廉江核电项目部
        </p>
      </div>
    </main>
  );
}
