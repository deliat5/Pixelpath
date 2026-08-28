import React, { useEffect, useState, useCallback, useRef } from "react";
import Header from "./components/Header";
import AuthScreen from "./components/AuthScreen";
import ProjectList from "./components/ProjectList";
import CalendarView from "./components/CalendarView";
import IslandPath from "./components/IslandPath";
import ChatWidget from "./components/ChatWidget";
import XPBar from "./components/XPBar";
import RewardsPanel from "./components/RewardsPanel";
import GraphView from "./components/GraphView";
import DailyGoal from "./components/DailyGoal";
import { getOutfitById } from "./outfits";
import { useSettings } from "./contexts/SettingsContext";
import { playClick, playWinItem, playWinSkin } from "./sound";
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getCPM,
  createTask,
  updateTaskStatus,
  editTask,
  deleteTask,
  isAuthenticated,
  logout,
} from "./api";

const STREAK_DAYS_PER_SKIN = 5; // must match backend/src/services/rewards.js

// Background music plays these in order, then loops back to the first -
// see the "ended" listener in the component for how that works.
const MUSIC_PLAYLIST = ["/sounds/music.mp3", "/sounds/music2.mp3", "/sounds/music3.mp3"];

export default function App() {
  const { t, musicVolume, musicMuted } = useSettings();
  const [authed, setAuthed] = useState(isAuthenticated());
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null); // the currently OPEN project (includes equippedCharacter/equippedRewardKey)
  const [tasks, setTasks] = useState([]);
  const [gameStats, setGameStats] = useState({ xp: 0, level: 1, pathProgress: 0 });
  const [dailyGoal, setDailyGoal] = useState({ goalTask: null, goalMetToday: false, streak: 0, longestStreak: 0 });
  const [objectRewards, setObjectRewards] = useState([]);
  const [skinRewards, setSkinRewards] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("projects"); // "projects" | "dashboard" | "graph"

  const musicRef = useRef(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const prevObjectCount = useRef(0);
  const prevSkinCount = useRef(0);

  // Kept in a ref so the "unlock" click listener below always reads the
  // CURRENT mute state, not whatever it was when the listener was set up -
  // without this, clicking mute could get silently undone by the very
  // same click (or any click shortly after) still triggering a leftover
  // autoplay-unlock replay.
  const musicMutedRef = useRef(musicMuted);
  useEffect(() => {
    musicMutedRef.current = musicMuted;
  }, [musicMuted]);

  // Loads and plays the current playlist track - fires on login (authed
  // changes) and whenever the track advances (trackIndex changes, see the
  // "ended" listener below). Browsers may block the very first autoplay
  // without a user gesture - if so, wait for exactly one real click
  // anywhere, then retry once and stop listening for good.
  useEffect(() => {
    const audio = musicRef.current;
    if (!audio || !authed) return;
    audio.src = MUSIC_PLAYLIST[trackIndex];
    if (musicMutedRef.current) return;

    const playAttempt = audio.play();
    if (!playAttempt || typeof playAttempt.catch !== "function") return;

    playAttempt.catch(() => {
      function unlock() {
        if (!musicMutedRef.current) audio.play().catch(() => {});
      }
      window.addEventListener("click", unlock, { once: true });
    });
  }, [authed, trackIndex]);

  // Advance to the next track when the current one finishes, looping back
  // to the first after the last - this is what makes the PLAYLIST loop,
  // rather than just one file repeating forever.
  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;
    function handleEnded() {
      setTrackIndex((prev) => (prev + 1) % MUSIC_PLAYLIST.length);
    }
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  useEffect(() => {
    const audio = musicRef.current;
    if (!audio) return;
    audio.volume = musicVolume;
    if (musicMuted) audio.pause();
    else audio.play().catch(() => {});
  }, [musicVolume, musicMuted]);

  // A generic click sound for any interactive element in the app -
  // buttons, links, form fields, custom role="button" elements - delegated
  // at the document level so nothing needs its own onClick wiring just
  // for this.
  useEffect(() => {
    function handleClick(e) {
      if (e.target.closest('button, a, input, select, textarea, [role="button"]')) playClick();
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Play a win sound whenever the reward counts actually increase (not on
  // first load, when they go from 0 to whatever was already earned).
  useEffect(() => {
    if (prevObjectCount.current > 0 && objectRewards.length > prevObjectCount.current) {
      playWinItem();
    }
    prevObjectCount.current = objectRewards.length;
  }, [objectRewards.length]);

  useEffect(() => {
    if (prevSkinCount.current > 0 && skinRewards.length > prevSkinCount.current) {
      playWinSkin();
    }
    prevSkinCount.current = skinRewards.length;
  }, [skinRewards.length]);

  const refreshProjectData = useCallback(async (projectId) => {
    try {
      setError(null);
      const cpmResult = await getCPM(projectId);
      setTasks(cpmResult.tasks);
      setGameStats(cpmResult.gameStats);
      setDailyGoal(cpmResult.dailyGoal);
      setObjectRewards(cpmResult.objectRewards || []);
      setSkinRewards(cpmResult.skinRewards || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const loadProjectList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getProjects();
      setProjects(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      loadProjectList();
    } else {
      setLoading(false);
    }
  }, [authed, loadProjectList]);

  // Navigation is a small three-state machine (projects / dashboard / graph),
  // synced with the browser's real History API so the back/forward buttons
  // work like normal page navigation instead of leaving the app entirely.
  useEffect(() => {
    function handlePopState(event) {
      const state = event.state || { view: "projects" };
      setView(state.view);
      if (state.view === "projects") {
        setProject(null);
      }
    }
    window.history.replaceState({ view: "projects" }, "");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  async function handleSelectProject(projectId) {
    setLoading(true);
    try {
      const fullProject = await getProject(projectId);
      setProject(fullProject);
      await refreshProjectData(projectId);
      window.history.pushState({ view: "dashboard" }, "");
      setView("dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject(name) {
    await createProject(name);
    await loadProjectList();
  }

  async function handleRenameProject(projectId, name) {
    try {
      await updateProject(projectId, { name });
      await loadProjectList();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteProject(projectId) {
    try {
      await deleteProject(projectId);
      await loadProjectList();
    } catch (err) {
      setError(err.message);
    }
  }

  function goToProjects() {
    window.history.pushState({ view: "projects" }, "");
    setProject(null);
    setView("projects");
    loadProjectList();
  }

  function goToGraph() {
    window.history.pushState({ view: "graph" }, "");
    setView("graph");
  }

  function goToDashboard() {
    window.history.pushState({ view: "dashboard" }, "");
    setView("dashboard");
  }

  function handleAuthenticated() {
    setAuthed(true);
  }

  function handleLogout() {
    logout();
    setAuthed(false);
    setProjects([]);
    setProject(null);
    setTasks([]);
    setView("projects");
  }

  async function handleAddTask(data) {
    try {
      await createTask(project.id, data);
      await refreshProjectData(project.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleComplete(taskId) {
    try {
      await updateTaskStatus(taskId, "done");
      await refreshProjectData(project.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEditTask(taskId, data) {
    try {
      await editTask(taskId, data);
      await refreshProjectData(project.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteTask(taskId) {
    try {
      await deleteTask(taskId);
      await refreshProjectData(project.id);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEquipCharacter(characterKey) {
    try {
      const updated = await updateProject(project.id, { equippedCharacter: characterKey });
      setProject(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleReward(itemKey) {
    const nextKey = project.equippedRewardKey === itemKey ? null : itemKey;
    try {
      const updated = await updateProject(project.id, { equippedRewardKey: nextKey });
      setProject(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!authed) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const equippedOutfit = project?.equippedRewardKey ? getOutfitById(project.equippedRewardKey) : null;

  // Built as a variable (not returned directly per branch) so the <audio>
  // element below stays in one stable position across EVERY state this
  // component can be in - including the brief loading flashes between
  // pages - not just the three main views. Any branch that used a direct
  // `return` here (as the loading state used to) skips the final wrapping
  // return and its <audio> tag entirely, which unmounts/remounts the
  // element and restarts the music - which is exactly what was happening
  // when navigating between the projects list and an open project.
  let content;

  if (loading) {
    content = (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 min-h-screen">
        {t("loading")}
      </div>
    );
  } else if (view === "projects") {
    content = (
      <div className="min-h-screen">
        <Header onLogout={handleLogout} showCharacterPicker={false} />
        {error && (
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm">
              {error}
            </div>
          </div>
        )}
        <ProjectList
          projects={projects}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onRenameProject={handleRenameProject}
          onDeleteProject={handleDeleteProject}
        />
      </div>
    );
  } else if (view === "graph") {
    content = (
      <div className="min-h-screen">
        <header className="w-full bg-gradient-to-r from-violet-600 to-violet-500 dark:from-violet-800 dark:to-violet-700 shadow-md mb-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
            <h1 className="font-pixel text-white text-sm sm:text-base tracking-wide drop-shadow">
              PixelPath
            </h1>
            <button
              type="button"
              onClick={goToDashboard}
              className="text-sm text-white/90 hover:text-white"
            >
              {t("back")}
            </button>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-4 pb-8">
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            {t("graphTitle")}
          </h2>
          <GraphView tasks={tasks} />
        </div>
      </div>
    );
  } else {
    content = (
      <div className="min-h-screen">
        <Header
          equippedCharacter={project?.equippedCharacter}
          onEquipCharacter={handleEquipCharacter}
          onLogout={handleLogout}
          unlockedSkinKeys={skinRewards.map((r) => r.itemKey)}
        />

        <div className="max-w-5xl mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={goToProjects}
              className="text-sm text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400"
            >
              {t("backToProjects")}
            </button>
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">{project?.name}</h2>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm mb-6">
              {error}
            </div>
          )}

          <DailyGoal
            goalTask={dailyGoal.goalTask}
            goalMetToday={dailyGoal.goalMetToday}
            streak={dailyGoal.streak}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-start">
            <div className="space-y-6">
              <CalendarView
                tasks={tasks}
                startDate={project?.createdAt}
                onAddTask={handleAddTask}
                onComplete={handleComplete}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
              <XPBar xp={gameStats.xp} level={gameStats.level} />
              <RewardsPanel
                objectRewards={objectRewards}
                skinRewards={skinRewards}
                equippedRewardKey={project?.equippedRewardKey}
                equippedCharacter={project?.equippedCharacter}
                onToggleReward={handleToggleReward}
                onEquipSkin={handleEquipCharacter}
                pointsUntilNextObject={gameStats.pointsUntilNextObject}
                pointsPerObject={gameStats.pointsPerObject}
                longestStreak={dailyGoal.longestStreak}
                streakDaysPerSkin={STREAK_DAYS_PER_SKIN}
              />
            </div>

            <div className="space-y-3">
              <IslandPath
                totalCritical={gameStats.totalCritical}
                completedCritical={gameStats.criticalCompleted}
                equippedCharacter={project?.equippedCharacter}
                equippedRewardImage={equippedOutfit?.image || null}
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={goToGraph}
              className="text-sm text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400"
            >
              {t("viewGraph")}
            </button>
          </div>
        </div>

        <ChatWidget projectId={project.id} onTasksAdded={() => refreshProjectData(project.id)} />
      </div>
    );
  }

  return (
    <>
      <audio ref={musicRef} className="hidden" />
      {content}
    </>
  );
}
