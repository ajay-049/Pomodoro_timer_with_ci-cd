import { useEffect, useMemo, useRef, useState } from 'react';

const SESSION_TYPES = {
  work: 'Work',
  shortBreak: 'Short Break',
  longBreak: 'Long Break',
};

const DEFAULT_SETTINGS = {
  work: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
};

const MINUTES_IN_MS = 60 * 1000;
const STORAGE_KEY = 'pomodoro-flow-state';

function getInitialState() {
  if (typeof window === 'undefined') {
    return {
      settings: DEFAULT_SETTINGS,
      completedWorkSessions: 0,
      sessionType: 'work',
    };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');

    if (!parsed) {
      return {
        settings: DEFAULT_SETTINGS,
        completedWorkSessions: 0,
        sessionType: 'work',
      };
    }

    return {
      settings: {
        work: parsed.settings?.work || DEFAULT_SETTINGS.work,
        shortBreak: parsed.settings?.shortBreak || DEFAULT_SETTINGS.shortBreak,
        longBreak: parsed.settings?.longBreak || DEFAULT_SETTINGS.longBreak,
        longBreakInterval:
          parsed.settings?.longBreakInterval || DEFAULT_SETTINGS.longBreakInterval,
      },
      completedWorkSessions: parsed.completedWorkSessions || 0,
      sessionType: parsed.sessionType || 'work',
    };
  } catch {
    return {
      settings: DEFAULT_SETTINGS,
      completedWorkSessions: 0,
      sessionType: 'work',
    };
  }
}

function App() {
  const initialState = getInitialState();
  const [settings, setSettings] = useState(initialState.settings);
  const [sessionType, setSessionType] = useState(initialState.sessionType);
  const [timeLeft, setTimeLeft] = useState(initialState.settings[initialState.sessionType] * MINUTES_IN_MS);
  const [isRunning, setIsRunning] = useState(false);
  const [completedWorkSessions, setCompletedWorkSessions] = useState(initialState.completedWorkSessions);
  const audioContextRef = useRef(null);

  const sessionDuration = useMemo(
    () => settings[sessionType] * MINUTES_IN_MS,
    [sessionType, settings]
  );

  useEffect(() => {
    setTimeLeft((current) => {
      if (isRunning) {
        return current;
      }

      return sessionDuration;
    });
  }, [isRunning, sessionDuration]);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1000) {
          window.clearInterval(intervalId);
          setIsRunning(false);
          handleSessionEnd();
          return 0;
        }

        return current - 1000;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, sessionType, settings]);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        settings,
        completedWorkSessions,
        sessionType,
      })
    );
  }, [completedWorkSessions, sessionType, settings]);

  const handleSessionEnd = () => {
    playNotification();

    if (sessionType === 'work') {
      setCompletedWorkSessions((current) => {
        const nextCount = current + 1;
        const nextSessionType =
          nextCount % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';

        setSessionType(nextSessionType);
        setTimeLeft(settings[nextSessionType] * MINUTES_IN_MS);
        return nextCount;
      });
      return;
    }

    setSessionType('work');
    setTimeLeft(settings.work * MINUTES_IN_MS);
  };

  const playNotification = () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    const context = audioContextRef.current;

    if (context.state === 'suspended') {
      context.resume();
    }

    const now = context.currentTime;
    const notes = [880, 1174.66, 1567.98];

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.0001, now + index * 0.18);
      gainNode.gain.exponentialRampToValueAtTime(0.18, now + index * 0.18 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.18 + 0.16);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(now + index * 0.18);
      oscillator.stop(now + index * 0.18 + 0.18);
    });
  };

  const handleStart = () => {
    if (timeLeft <= 0) {
      setTimeLeft(sessionDuration);
    }

    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(sessionDuration);
  };

  const switchSession = (nextSessionType) => {
    setIsRunning(false);
    setSessionType(nextSessionType);
    setTimeLeft(settings[nextSessionType] * MINUTES_IN_MS);
  };

  const handleSkip = () => {
    setIsRunning(false);
    handleSessionEnd();
  };

  const handleSettingsChange = (key, value) => {
    const nextValue = Number(value);

    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      return;
    }

    setSettings((current) => {
      const nextSettings = {
        ...current,
        [key]: nextValue,
      };

      if (sessionType === key && !isRunning) {
        setTimeLeft(nextValue * MINUTES_IN_MS);
      }

      return nextSettings;
    });
  };

  const formattedTime = formatTime(timeLeft);
  const progress = ((sessionDuration - timeLeft) / sessionDuration) * 100;
  const nextBreakType =
    (completedWorkSessions + 1) % settings.longBreakInterval === 0 ? 'Long Break' : 'Short Break';
  const currentStepLabel =
    sessionType === 'work'
      ? `Focus now. Your next recovery session will be a ${nextBreakType}.`
      : 'Rest now. When this break ends, the app returns to a new work session.';

  useEffect(() => {
    document.title = `${formattedTime} • ${SESSION_TYPES[sessionType]} • Pomodoro Flow`;
  }, [formattedTime, sessionType]);

  return (
    <main className={`app-shell ${sessionType}`}>
      <section className="hero-card" aria-labelledby="timer-title">
        <div className="hero-copy">
          <p className="eyebrow">Pomodoro Flow and help to focus.</p>
          <h1 id="timer-title">Stay in rhythm, one focused session at a time.</h1>
          <p className="lede">
            A distraction-light timer with flexible intervals, clear session tracking, and
            a gentle completion chime.
          </p>
          <div className="mini-guide" aria-label="How to use the timer">
            <div>
              <strong>1.</strong> Start a work session and focus on one task only.
            </div>
            <div>
              <strong>2.</strong> Pause, resume, or reset anytime if your flow changes.
            </div>
            <div>
              <strong>3.</strong> Follow the break prompts so your work rhythm stays sustainable.
            </div>
          </div>
        </div>

        <div className="timer-card" role="timer" aria-live="polite">
          <div className="session-switcher" aria-label="Choose session type">
            {Object.entries(SESSION_TYPES).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={key === sessionType ? 'switch-chip active' : 'switch-chip'}
                onClick={() => switchSession(key)}
                aria-pressed={key === sessionType}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="session-pill">{SESSION_TYPES[sessionType]}</div>
          <div className="timer-display" aria-label={`${formattedTime} remaining`}>
            {formattedTime}
          </div>
          <p className="session-note">{currentStepLabel}</p>
          <div
            className="progress-track"
            aria-hidden="true"
          >
            <span className="progress-bar" style={{ width: `${Math.max(progress, 0)}%` }} />
          </div>

          <div className="action-row">
            {!isRunning ? (
              <button type="button" className="primary-btn" onClick={handleStart}>
                {timeLeft === sessionDuration ? 'Start' : 'Resume'}
              </button>
            ) : (
              <button type="button" className="primary-btn" onClick={handlePause}>
                Pause
              </button>
            )}
            <button type="button" className="secondary-btn" onClick={handleReset}>
              Reset
            </button>
            <button type="button" className="secondary-btn" onClick={handleSkip}>
              Skip
            </button>
          </div>

          <dl className="stats-grid">
            <div>
              <dt>Completed Work Sessions</dt>
              <dd>{completedWorkSessions}</dd>
            </div>
            <div>
              <dt>Long Break Every</dt>
              <dd>{settings.longBreakInterval} sessions</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="settings-card" aria-labelledby="settings-title">
        <div className="section-heading">
          <h2 id="settings-title">Session Settings</h2>
          <p>
            Adjust your intervals in minutes. Preferences are saved in the browser, and changes
            apply instantly when the timer is idle.
          </p>
        </div>

        <form className="settings-grid">
          <label>
            Work
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={settings.work}
              onChange={(event) => handleSettingsChange('work', event.target.value)}
            />
          </label>
          <label>
            Short Break
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={settings.shortBreak}
              onChange={(event) => handleSettingsChange('shortBreak', event.target.value)}
            />
          </label>
          <label>
            Long Break
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={settings.longBreak}
              onChange={(event) => handleSettingsChange('longBreak', event.target.value)}
            />
          </label>
          <label>
            Long Break After
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={settings.longBreakInterval}
              onChange={(event) => handleSettingsChange('longBreakInterval', event.target.value)}
            />
          </label>
        </form>

        <div className="tips-panel" aria-labelledby="tips-title">
          <h3 id="tips-title">Using The Timer Well rwer werwer wer wer</h3>
          <ul>
            <li>Use Work for focused effort, then let the app guide you into a Short or Long Break.</li>
            <li>The completed session counter increases only after a full work session ends.</li>
            <li>Use Skip if you want to move directly to the next session without waiting.</li>
            <li>Your chosen durations stay saved, so the timer remembers how you like to work.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function formatTime(milliseconds) {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default App;
