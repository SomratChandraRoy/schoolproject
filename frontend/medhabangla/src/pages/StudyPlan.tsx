import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const StudyPlan: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [generating, setGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/academics/study-plans/", {
        headers: { Authorization: `Token ${token}` },
      });
      setPlans(res.data);
      if (res.data.length > 0) {
        setSelectedPlan(res.data[0]);
      }
    } catch (error) {
      console.error("Error fetching plans", error);
    }
  };

  const generatePlan = async () => {
    if (!instruction.trim()) return;
    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/api/academics/study-plans/generate_plan/",
        {
          instruction: instruction,
          title: "AI Generated Plan - " + new Date().toLocaleDateString(),
        },
        {
          headers: { Authorization: `Token ${token}` },
        },
      );
      setPlans([res.data, ...plans]);
      setSelectedPlan(res.data);
      setInstruction("");
    } catch (error: any) {
      console.error("Error generating plan", error);
      alert(
        "Failed to generate plan: " +
          (error.response?.data?.error || error.message),
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:flex gap-6 min-h-[80vh]">
      <div className="md:w-1/3 mb-6 md:mb-0 space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Generate AI Plan
          </h2>
          <textarea
            className="w-full p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white mb-4"
            rows={4}
            placeholder="E.g., I want to prepare for my math and physics finals in 3 months. Create a weekly study schedule."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}></textarea>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
            {generating ? "?? AI is Thinking..." : "? Generate Study Plan"}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3">
            My Saved Plans
          </h3>
          {plans.length === 0 ? (
            <p className="text-sm text-gray-500">No plans yet.</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {plans.map((plan) => (
                <li
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className="p-3 rounded-lg cursor-pointer text-sm font-medium">
                  {plan.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="md:w-2/3 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[85vh]">
        {selectedPlan ? (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{selectedPlan.plan_content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <span className="text-6xl mb-4">??</span>
            <p className="text-lg">
              Select a plan from the left or generate a new one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPlan;
