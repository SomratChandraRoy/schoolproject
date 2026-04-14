import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

interface SyllabusTopic {
  id: number;
  subject: number;
  subject_name: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "need_revision";
  is_important: boolean;
  order_index: number;
}

interface Subject {
  id: number;
  name: string;
  color_code: string;
  icon: string | null;
  progress_percentage: number;
  topics: SyllabusTopic[];
  created_at: string;
}

const normalizeSubjectsPayload = (payload: unknown): Subject[] => {
  if (Array.isArray(payload)) {
    return payload as Subject[];
  }

  if (payload && typeof payload === "object") {
    const maybeResults = (payload as { results?: unknown }).results;
    if (Array.isArray(maybeResults)) {
      return maybeResults as Subject[];
    }
  }

  return [];
};

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "need_revision", label: "Need Revision" },
] as const;

const Syllabus: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [subjectName, setSubjectName] = useState("");
  const [subjectColor, setSubjectColor] = useState("#3B82F6");
  const [addingSubject, setAddingSubject] = useState(false);

  const [topicInputs, setTopicInputs] = useState<Record<number, string>>({});
  const [addingTopicsFor, setAddingTopicsFor] = useState<number | null>(null);
  const [updatingTopicId, setUpdatingTopicId] = useState<number | null>(null);
  const [deletingTopicId, setDeletingTopicId] = useState<number | null>(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState<number | null>(
    null,
  );

  const token = localStorage.getItem("token");

  const overallStats = useMemo(() => {
    const subjectList = Array.isArray(subjects) ? subjects : [];
    const totalSubjects = subjectList.length;
    const allTopics = subjectList.flatMap((subject) =>
      Array.isArray(subject.topics) ? subject.topics : [],
    );
    const totalTopics = allTopics.length;
    const completedTopics = allTopics.filter(
      (topic) => topic.status === "completed",
    ).length;
    const overallProgress =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return { totalSubjects, totalTopics, completedTopics, overallProgress };
  }, [subjects]);

  useEffect(() => {
    if (!token) {
      window.location.assign("/login");
      return;
    }

    void fetchSubjects();
  }, [token]);

  const getHeaders = (json = true): HeadersInit => {
    const headers: HeadersInit = {
      Authorization: `Token ${token}`,
    };

    if (json) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/academics/subjects/", {
        headers: getHeaders(false),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch syllabus subjects");
      }

      const payload: unknown = await response.json();
      const normalizedSubjects = normalizeSubjectsPayload(payload);
      setSubjects(normalizedSubjects);

      if (normalizedSubjects.length === 0 && Array.isArray(payload) === false) {
        const detail =
          payload &&
          typeof payload === "object" &&
          typeof (payload as { detail?: unknown }).detail === "string"
            ? (payload as { detail?: string }).detail
            : "";

        if (detail) {
          setError(detail);
        }
      }
    } catch (err) {
      setError("Could not load your syllabus right now.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = subjectName.trim();
    if (!trimmedName) {
      setError("Subject name is required.");
      return;
    }

    setAddingSubject(true);
    setError("");

    try {
      const response = await fetch("/api/academics/subjects/", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: trimmedName,
          color_code: subjectColor,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.name?.[0] || "Failed to add subject");
      }

      const created: Subject = await response.json();
      setSubjects((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return [...safePrev, created];
      });
      setSubjectName("");
      setSubjectColor("#3B82F6");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add subject.");
    } finally {
      setAddingSubject(false);
    }
  };

  const parseTopics = (rawInput: string): string[] => {
    return rawInput
      .split(/\r?\n|,/g)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const handleAddTopics = async (subjectId: number) => {
    const rawInput = topicInputs[subjectId] || "";
    const topics = parseTopics(rawInput);

    if (!topics.length) {
      setError("Please add at least one topic.");
      return;
    }

    setAddingTopicsFor(subjectId);
    setError("");

    try {
      const response = await fetch(
        `/api/academics/subjects/${subjectId}/bulk_add_topics/`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ topics }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.topics?.[0] || errorData?.detail || "Failed to add topics",
        );
      }

      const result = await response.json();

      if (result.skipped_count > 0) {
        setError(
          `${result.skipped_count} topic(s) were skipped because they already exist.`,
        );
      }

      setTopicInputs((prev) => ({ ...prev, [subjectId]: "" }));
      await fetchSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add topics.");
    } finally {
      setAddingTopicsFor(null);
    }
  };

  const handleStatusChange = async (
    topicId: number,
    status: SyllabusTopic["status"],
  ) => {
    setUpdatingTopicId(topicId);
    setError("");

    try {
      const response = await fetch(`/api/academics/topics/${topicId}/`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update topic status");
      }

      const updatedTopic: SyllabusTopic = await response.json();

      setSubjects((prev) =>
        (Array.isArray(prev) ? prev : []).map((subject) => {
          if (subject.id !== updatedTopic.subject) {
            return subject;
          }

          const updatedTopics = subject.topics.map((topic) =>
            topic.id === updatedTopic.id ? updatedTopic : topic,
          );

          const completedCount = updatedTopics.filter(
            (topic) => topic.status === "completed",
          ).length;
          const progress =
            updatedTopics.length > 0
              ? Math.round((completedCount / updatedTopics.length) * 100)
              : 0;

          return {
            ...subject,
            topics: updatedTopics,
            progress_percentage: progress,
          };
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update topic status.",
      );
    } finally {
      setUpdatingTopicId(null);
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!window.confirm("Delete this topic?")) {
      return;
    }

    setDeletingTopicId(topicId);
    setError("");

    try {
      const response = await fetch(`/api/academics/topics/${topicId}/`, {
        method: "DELETE",
        headers: getHeaders(false),
      });

      if (!response.ok) {
        throw new Error("Failed to delete topic");
      }

      await fetchSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete topic.");
    } finally {
      setDeletingTopicId(null);
    }
  };

  const handleDeleteSubject = async (subjectId: number) => {
    if (
      !window.confirm(
        "Delete this subject and all its topics? This action cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingSubjectId(subjectId);
    setError("");

    try {
      const response = await fetch(`/api/academics/subjects/${subjectId}/`, {
        method: "DELETE",
        headers: getHeaders(false),
      });

      if (!response.ok) {
        throw new Error("Failed to delete subject");
      }

      setSubjects((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (subject) => subject.id !== subjectId,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete this subject.",
      );
    } finally {
      setDeletingSubjectId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Syllabus Planner
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Add subjects, add multiple topics per subject, and track your
              completion progress.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Subjects</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {overallStats.totalSubjects}
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Topics</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {overallStats.totalTopics}
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Completed
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {overallStats.completedTopics}
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Overall Progress
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {overallStats.overallProgress}%
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-lg bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Add New Subject
          </h2>
          <form
            onSubmit={handleAddSubject}
            className="grid grid-cols-1 gap-3 md:grid-cols-[2fr,1fr,auto]">
            <input
              type="text"
              value={subjectName}
              onChange={(event) => setSubjectName(event.target.value)}
              placeholder="Subject name (e.g. Bangla, English, Math)"
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
              required
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 dark:text-gray-300">
                Color
              </label>
              <input
                type="color"
                value={subjectColor}
                onChange={(event) => setSubjectColor(event.target.value)}
                className="h-10 w-16 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
            <button
              type="submit"
              disabled={addingSubject}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {addingSubject ? "Adding..." : "Add Subject"}
            </button>
          </form>
        </div>

        {subjects.length === 0 ? (
          <div className="rounded-lg bg-white dark:bg-gray-800 p-8 text-center border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No Subjects Added Yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Start by adding your first subject, then add all related topics.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: subject.color_code }}></span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {subject.name}
                    </h3>
                    <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-200">
                      {subject.topics.length} topic(s)
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteSubject(subject.id)}
                    disabled={deletingSubjectId === subject.id}
                    className="rounded-md border border-red-300 dark:border-red-700 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60">
                    {deletingSubjectId === subject.id
                      ? "Deleting..."
                      : "Delete Subject"}
                  </button>
                </div>

                <div className="px-6 pt-4">
                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Progress
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {subject.progress_percentage}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${subject.progress_percentage}%`,
                          backgroundColor: subject.color_code,
                        }}></div>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 grid gap-5 lg:grid-cols-[2fr,1fr]">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                      Topics
                    </h4>

                    {subject.topics.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No topics yet for this subject.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {subject.topics.map((topic) => (
                          <div
                            key={topic.id}
                            className="rounded-md border border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {topic.title}
                              </p>
                              {topic.description ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {topic.description}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={topic.status}
                                onChange={(event) =>
                                  handleStatusChange(
                                    topic.id,
                                    event.target
                                      .value as SyllabusTopic["status"],
                                  )
                                }
                                disabled={updatingTopicId === topic.id}
                                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-800 dark:text-gray-100">
                                {statusOptions.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleDeleteTopic(topic.id)}
                                disabled={deletingTopicId === topic.id}
                                className="rounded-md border border-red-300 dark:border-red-700 px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60">
                                {deletingTopicId === topic.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                      Add Topics
                    </h4>
                    <textarea
                      value={topicInputs[subject.id] || ""}
                      onChange={(event) =>
                        setTopicInputs((prev) => ({
                          ...prev,
                          [subject.id]: event.target.value,
                        }))
                      }
                      placeholder={
                        "Enter topics separated by new lines or commas.\nExample:\nNoun\nVerb\nSentence"
                      }
                      rows={7}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => handleAddTopics(subject.id)}
                      disabled={addingTopicsFor === subject.id}
                      className="mt-3 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                      {addingTopicsFor === subject.id
                        ? "Adding Topics..."
                        : "Add Topic(s)"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Syllabus;
