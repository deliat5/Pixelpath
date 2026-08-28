import React, { useState } from "react";
import { useSettings } from "../contexts/SettingsContext";

function ProjectCard({ project, onSelect, onRename, onDelete }) {
  const { t } = useSettings();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function submitRename(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onRename(project.id, name.trim());
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-violet-300 dark:border-violet-600 space-y-3">
        <form onSubmit={submitRename} className="space-y-2">
          <input
            autoFocus
            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-1 text-xs bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700"
            >
              <img src="/icons/check.png" alt="" className="w-3.5 h-3.5 object-contain" />
              {t("saveChanges")}
            </button>
            <button
              type="button"
              onClick={() => {
                setName(project.name);
                setEditing(false);
                setConfirmingDelete(false);
              }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <img src="/icons/cancel.png" alt="" className="w-3.5 h-3.5 object-contain" />
              {t("cancel")}
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600 dark:text-red-400">{t("confirmDelete")}</span>
              <button
                type="button"
                onClick={() => onDelete(project.id)}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                {t("deleteProject")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <img src="/icons/cancel.png" alt="" className="w-3.5 h-3.5 object-contain" />
                {t("cancel")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400"
            >
              {t("deleteProject")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md border border-transparent hover:border-violet-300 dark:hover:border-violet-600 transition">
      <button
        type="button"
        onClick={() => setEditing(true)}
        title={t("editProject")}
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-900/30"
      >
        <img src="/icons/edit.png" alt="" className="w-4 h-4 object-contain" />
      </button>

      <button type="button" onClick={() => onSelect(project.id)} className="text-left w-full pr-8">
        <p className="font-medium text-slate-800 dark:text-slate-100">{project.name}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {project._count?.tasks ?? 0} {t("tasksLabel")}
        </p>
      </button>
    </div>
  );
}

export default function ProjectList({ projects, onSelectProject, onCreateProject, onRenameProject, onDeleteProject }) {
  const { t } = useSettings();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await onCreateProject(newName.trim());
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="font-pixel text-violet-700 dark:text-violet-300 text-sm mb-6">
        {t("myProjects")}
      </h1>

      {projects.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t("noProjectsYet")}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onSelect={onSelectProject}
            onRename={onRenameProject}
            onDelete={onDeleteProject}
          />
        ))}
      </div>

      <form onSubmit={handleCreate} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex gap-2">
        <input
          className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          placeholder={t("newProjectPlaceholder")}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="submit"
          disabled={creating}
          className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50 whitespace-nowrap"
        >
          {t("newProject")}
        </button>
      </form>
    </div>
  );
}
