const timeEl = document.getElementById("time");
const progressBar = document.getElementById("progress-bar");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");
const setForm = document.getElementById("set-form");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const soundToggle = document.getElementById("sound-toggle");
const remainingEl = document.getElementById("remaining");
const totalEl = document.getElementById("total");
const statusEl = document.getElementById("status");

let totalMs = 300000;
let remainingMs = 300000;
let timerId = null;
let isRunning = false;
let soundOn = true;
let lastTick = null;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

const updateDisplay = () => {
  timeEl.textContent = formatTime(remainingMs);
  remainingEl.textContent = formatTime(remainingMs);
  totalEl.textContent = formatTime(totalMs);
  const progress = totalMs === 0 ? 0 : ((totalMs - remainingMs) / totalMs) * 100;
  progressBar.style.width = `${progress}%`;
};

const updateStatus = (text) => {
  statusEl.textContent = text;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const setTimer = (minutes, seconds) => {
  const safeMinutes = clamp(minutes, 0, 999);
  const safeSeconds = clamp(seconds, 0, 59);
  totalMs = (safeMinutes * 60 + safeSeconds) * 1000;
  remainingMs = totalMs;
  updateDisplay();
  updateStatus("待機中");
};

const tick = () => {
  const now = performance.now();
  if (lastTick === null) lastTick = now;
  const delta = now - lastTick;
  lastTick = now;
  remainingMs = Math.max(0, remainingMs - delta);

  if (remainingMs <= 0) {
    stopTimer();
    remainingMs = 0;
    updateDisplay();
    updateStatus("完了");
    if (soundOn) playBeep();
    return;
  }
  updateDisplay();
};

const startTimer = () => {
  if (isRunning || totalMs === 0) return;
  isRunning = true;
  updateStatus("実行中");
  lastTick = performance.now();
  timerId = setInterval(tick, 10);
};

const stopTimer = () => {
  if (!isRunning) return;
  clearInterval(timerId);
  timerId = null;
  isRunning = false;
  lastTick = null;
};

const resetTimer = () => {
  stopTimer();
  remainingMs = totalMs;
  updateDisplay();
  updateStatus("待機中");
};

const playBeep = () => {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.8);
};

setForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const minutes = Number(minutesInput.value) || 0;
  const seconds = Number(secondsInput.value) || 0;
  setTimer(minutes, seconds);
});

startBtn.addEventListener("click", startTimer);

pauseBtn.addEventListener("click", () => {
  stopTimer();
  updateStatus("一時停止");
});

resetBtn.addEventListener("click", resetTimer);

soundToggle.addEventListener("click", () => {
  soundOn = !soundOn;
  soundToggle.textContent = `サウンド: ${soundOn ? "ON" : "OFF"}`;
});

Array.from(document.querySelectorAll(".quick button")).forEach((button) => {
  button.addEventListener("click", () => {
    const minutes = Number(button.dataset.minutes);
    setTimer(minutes, 0);
  });
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    if (isRunning) {
      stopTimer();
      updateStatus("一時停止");
    } else {
      startTimer();
    }
  }
  if (event.key.toLowerCase() === "r") {
    resetTimer();
  }
});

setTimer(5, 0);
