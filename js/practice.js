// Practice & Earn: interactive mode where kids solve exercises online and
// earn screen-time minutes. Not sheet-based - one task at a time, mobile-first.
//
// Earning model (kept deliberately transparent for parents and kids):
//   task value (minutes) = base rate (parent setting) x topic difficulty factor
//   first try correct  -> full value
//   second try correct -> half value
//   two wrong attempts -> solution is shown, 0 minutes, next task
// Every task's worth is displayed before it is answered, and each session is
// logged (topics, counts, minutes) so parents can verify what was earned.

import { generateProblem } from './problemGenerators.js';
import { setSeed } from './mathUtils.js';
import { getPreferredLanguage, setPreferredLanguage } from './translations.js';

const SETTINGS_KEY = 'ufzgiblatt_practice_settings';
const LOG_KEY = 'ufzgiblatt_practice_log';

// Topics with a plain numeric answer, per grade, with a difficulty factor
// that scales the minutes a correct answer is worth.
const PRACTICE_TOPICS = {
    add_10: { grades: [1], factor: 1 },
    sub_10: { grades: [1], factor: 1 },
    bonds_10: { grades: [1], factor: 1 },
    add_20: { grades: [1, 2], factor: 1.5 },
    sub_20: { grades: [1, 2], factor: 1.5 },
    add_100_simple: { grades: [2, 3], factor: 2 },
    sub_100_simple: { grades: [2, 3], factor: 2 },
    add_100_carry: { grades: [2, 3], factor: 2.5 },
    sub_100_carry: { grades: [2, 3], factor: 2.5 },
    married_100: { grades: [2, 3], factor: 1.5 },
    mult_2_5_10: { grades: [2, 3], factor: 1.5 },
    mult_all: { grades: [3, 4], factor: 2.5 },
    div_2_5_10: { grades: [3, 4], factor: 2 },
    add_1000: { grades: [4, 5, 6], factor: 3 },
    sub_1000: { grades: [4, 5, 6], factor: 3 },
    mult_10_100: { grades: [4, 5, 6], factor: 2.5 }
};

const STRINGS = {
    de: {
        title: "Üben & Bildschirmzeit verdienen",
        intro: "Löse Aufgaben und verdiene dir Bildschirmzeit. Je schwieriger die Aufgabe, desto mehr Minuten gibt es!",
        gradeLabel: "Klasse",
        grades: { 1: "1. Klasse", 2: "2. Klasse", 3: "3. Klasse", 4: "4. Klasse", 5: "5. Klasse", 6: "6. Klasse" },
        goalLabel: "Ziel (Minuten)",
        rateLabel: "Basis-Minuten pro Aufgabe",
        rateHint: "Eine leichte Aufgabe ist so viele Minuten wert; schwierigere zählen bis 3x mehr.",
        parentSection: "Einstellungen (für Eltern)",
        btnStart: "▶️ Los geht's!",
        btnCheck: "Prüfen",
        btnNext: "Weiter →",
        btnFinish: "Fertig",
        btnAgain: "Nochmal üben",
        worth: "Diese Aufgabe ist {min} Min. wert",
        secondTry: "Fast! Versuch es noch einmal – jetzt für {min} Min.",
        solutionWas: "Die Lösung war {answer}.",
        correctFull: "Richtig! +{min} Min. 🎉",
        correctHalf: "Richtig! +{min} Min. 👍",
        earned: "Verdient",
        goal: "Ziel",
        goalReached: "🏆 Ziel erreicht! Super gemacht!",
        summaryTitle: "Zusammenfassung",
        summaryTasks: "Aufgaben gelöst",
        summaryFirstTry: "Beim ersten Versuch",
        summaryMinutes: "Verdiente Bildschirmzeit",
        summaryTopics: "Geübte Themen",
        summaryShow: "Zeig diese Seite deinen Eltern!",
        logTitle: "Frühere Übungen",
        logEmpty: "Noch keine Übungen abgeschlossen.",
        logMinutes: "{min} Min.",
        logTasks: "{n} Aufgaben ({grade}. Klasse)",
        clearLog: "Verlauf löschen",
        clearLogConfirm: "Ganzen Übungs-Verlauf löschen?",
        inputPlaceholder: "?",
        bondsQuestion: "{a} + ? = {sum}",
        marriedQuestion: "{a} + ? = 100",
        topics: {
            add_10: "Addition bis 10", sub_10: "Subtraktion bis 10", bonds_10: "Verliebte Zahlen",
            add_20: "Addition bis 20", sub_20: "Subtraktion bis 20",
            add_100_simple: "Addition bis 100", sub_100_simple: "Subtraktion bis 100",
            add_100_carry: "Addition mit Übertrag", sub_100_carry: "Subtraktion mit Übertrag",
            married_100: "Verheiratete Zahlen", mult_2_5_10: "Einmaleins (2/5/10)",
            mult_all: "Einmaleins", div_2_5_10: "Division (2/5/10)",
            add_1000: "Addition bis 1000", sub_1000: "Subtraktion bis 1000",
            mult_10_100: "Mal 10/100"
        }
    },
    en: {
        title: "Practice & Earn Screen Time",
        intro: "Solve exercises and earn screen time. The harder the task, the more minutes you get!",
        gradeLabel: "Grade",
        grades: { 1: "1st Grade", 2: "2nd Grade", 3: "3rd Grade", 4: "4th Grade", 5: "5th Grade", 6: "6th Grade" },
        goalLabel: "Goal (minutes)",
        rateLabel: "Base minutes per task",
        rateHint: "An easy task is worth this many minutes; harder ones count up to 3x more.",
        parentSection: "Settings (for parents)",
        btnStart: "▶️ Let's go!",
        btnCheck: "Check",
        btnNext: "Next →",
        btnFinish: "Done",
        btnAgain: "Practice again",
        worth: "This task is worth {min} min",
        secondTry: "Almost! Try again – now for {min} min.",
        solutionWas: "The answer was {answer}.",
        correctFull: "Correct! +{min} min 🎉",
        correctHalf: "Correct! +{min} min 👍",
        earned: "Earned",
        goal: "Goal",
        goalReached: "🏆 Goal reached! Well done!",
        summaryTitle: "Summary",
        summaryTasks: "Tasks solved",
        summaryFirstTry: "On the first try",
        summaryMinutes: "Screen time earned",
        summaryTopics: "Topics practiced",
        summaryShow: "Show this page to your parents!",
        logTitle: "Previous sessions",
        logEmpty: "No sessions completed yet.",
        logMinutes: "{min} min",
        logTasks: "{n} tasks (grade {grade})",
        clearLog: "Clear history",
        clearLogConfirm: "Delete the whole practice history?",
        inputPlaceholder: "?",
        bondsQuestion: "{a} + ? = {sum}",
        marriedQuestion: "{a} + ? = 100",
        topics: {
            add_10: "Addition up to 10", sub_10: "Subtraction up to 10", bonds_10: "Number bonds",
            add_20: "Addition up to 20", sub_20: "Subtraction up to 20",
            add_100_simple: "Addition up to 100", sub_100_simple: "Subtraction up to 100",
            add_100_carry: "Addition w/ regrouping", sub_100_carry: "Subtraction w/ regrouping",
            married_100: "Married numbers", mult_2_5_10: "Times tables (2/5/10)",
            mult_all: "Times tables", div_2_5_10: "Division (2/5/10)",
            add_1000: "Addition up to 1000", sub_1000: "Subtraction up to 1000",
            mult_10_100: "Times 10/100"
        }
    }
};

let T;
let lang;
let settings;
let session = null;
let currentTask = null;

function trackEvent(name, props = {}) {
    if (window.posthog) window.posthog.capture(name, { ...props, lang });
}

function loadSettings() {
    const defaults = { grade: 2, goalMinutes: 30, baseRate: 0.5 };
    try {
        return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch (e) {
        return defaults;
    }
}

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) { /* private mode */ }
}

function loadLog() {
    try {
        return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    } catch (e) {
        return [];
    }
}

function appendLog(entry) {
    const log = loadLog();
    log.unshift(entry);
    try {
        localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(0, 50)));
    } catch (e) { /* private mode */ }
}

function topicsForGrade(grade) {
    return Object.keys(PRACTICE_TOPICS).filter(t => PRACTICE_TOPICS[t].grades.includes(grade));
}

// Round to one decimal to avoid float artifacts in displayed minutes
function r1(x) {
    return Math.round(x * 10) / 10;
}

function taskValue(topic) {
    return r1(settings.baseRate * PRACTICE_TOPICS[topic].factor);
}

function fmt(template, vars) {
    return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] !== undefined ? vars[k] : `{${k}}`);
}

function el(id) {
    return document.getElementById(id);
}

// --- SCREENS ---

function showScreen(name) {
    ['setup-screen', 'task-screen', 'summary-screen'].forEach(id => {
        el(id).style.display = (id === name) ? 'block' : 'none';
    });
}

function renderSetup() {
    el('practice-title').textContent = T.title;
    el('practice-intro').textContent = T.intro;
    el('label-grade').textContent = T.gradeLabel;
    el('label-goal').textContent = T.goalLabel;
    el('label-rate').textContent = T.rateLabel;
    el('rate-hint').textContent = T.rateHint;
    el('parent-legend').textContent = T.parentSection;
    el('btn-start').textContent = T.btnStart;

    const gradeSel = el('practice-grade');
    gradeSel.innerHTML = '';
    for (let g = 1; g <= 6; g++) {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = T.grades[g];
        gradeSel.appendChild(opt);
    }
    gradeSel.value = settings.grade;
    el('practice-goal').value = settings.goalMinutes;
    el('practice-rate').value = settings.baseRate;

    renderLog();
}

function renderLog() {
    const log = loadLog();
    el('log-title').textContent = T.logTitle;
    const list = el('log-list');
    list.innerHTML = '';
    el('btn-clear-log').textContent = T.clearLog;
    el('btn-clear-log').style.display = log.length ? 'inline-block' : 'none';

    if (log.length === 0) {
        const p = document.createElement('p');
        p.className = 'log-empty';
        p.textContent = T.logEmpty;
        list.appendChild(p);
        return;
    }

    log.forEach(entry => {
        const row = document.createElement('div');
        row.className = 'log-row';

        const date = document.createElement('span');
        date.className = 'log-date';
        date.textContent = new Date(entry.ts).toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB',
            { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

        const tasks = document.createElement('span');
        tasks.className = 'log-tasks';
        tasks.textContent = fmt(T.logTasks, { n: entry.solved, grade: entry.grade });

        const mins = document.createElement('span');
        mins.className = 'log-minutes';
        mins.textContent = fmt(T.logMinutes, { min: entry.minutes });

        row.append(date, tasks, mins);
        list.appendChild(row);
    });
}

function startSession() {
    settings.grade = parseInt(el('practice-grade').value) || 2;
    settings.goalMinutes = Math.min(Math.max(parseInt(el('practice-goal').value) || 30, 5), 240);
    settings.baseRate = Math.min(Math.max(parseFloat(el('practice-rate').value) || 0.5, 0.1), 5);
    saveSettings();

    session = {
        grade: settings.grade,
        started: Date.now(),
        earned: 0,
        solved: 0,
        firstTry: 0,
        failed: 0,
        topicCounts: {},
        goalShown: false
    };

    // Fresh, non-reproducible seed per session: reusing a seed would let kids
    // replay a known task sequence for free minutes
    setSeed(Math.floor(Math.random() * 0xFFFFFFFF));

    trackEvent('practice_start', { grade: session.grade, goal: settings.goalMinutes, rate: settings.baseRate });

    el('btn-check').textContent = T.btnCheck;
    el('btn-finish').textContent = T.btnFinish;
    showScreen('task-screen');
    nextTask();
}

function nextTask() {
    const topics = topicsForGrade(session.grade);
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const problem = generateProblem(topic);
    const value = taskValue(topic);

    currentTask = { topic, problem, value, attempts: 0 };

    el('task-topic').textContent = `${T.grades[session.grade]} · ${T.topics[topic]}`;
    el('task-worth').textContent = fmt(T.worth, { min: value });
    el('task-feedback').textContent = '';
    el('task-feedback').className = 'task-feedback';

    const question = el('task-question');
    if (problem.type === 'missing_addend') {
        question.textContent = fmt(T.bondsQuestion, { a: problem.a, sum: problem.sum });
    } else if (problem.type === 'married_numbers') {
        question.textContent = fmt(T.marriedQuestion, { a: problem.a });
    } else {
        question.textContent = `${problem.a} ${problem.op} ${problem.b} =`;
    }

    const input = el('task-input');
    input.value = '';
    input.disabled = false;
    input.placeholder = T.inputPlaceholder;
    el('btn-check').style.display = 'inline-block';
    el('btn-next').style.display = 'none';
    input.focus();

    updateProgress();
}

function expectedAnswer() {
    return Number(currentTask.problem.answer);
}

function checkAnswer() {
    const input = el('task-input');
    if (input.value.trim() === '') {
        input.focus();
        return;
    }
    const given = Number(input.value.trim().replace(',', '.'));
    const feedback = el('task-feedback');

    if (given === expectedAnswer()) {
        const value = currentTask.attempts === 0 ? currentTask.value : r1(currentTask.value / 2);
        session.earned = r1(session.earned + value);
        session.solved++;
        if (currentTask.attempts === 0) session.firstTry++;
        session.topicCounts[currentTask.topic] = (session.topicCounts[currentTask.topic] || 0) + 1;

        feedback.textContent = fmt(currentTask.attempts === 0 ? T.correctFull : T.correctHalf, { min: value });
        feedback.className = 'task-feedback correct';
        finishTask();
    } else {
        currentTask.attempts++;
        if (currentTask.attempts === 1) {
            feedback.textContent = fmt(T.secondTry, { min: r1(currentTask.value / 2) });
            feedback.className = 'task-feedback retry';
            input.value = '';
            input.focus();
        } else {
            session.failed++;
            feedback.textContent = fmt(T.solutionWas, { answer: currentTask.problem.answer });
            feedback.className = 'task-feedback incorrect';
            finishTask();
        }
    }
    updateProgress();
}

function finishTask() {
    el('task-input').disabled = true;
    el('btn-check').style.display = 'none';
    el('btn-next').style.display = 'inline-block';
    el('btn-next').textContent = T.btnNext;
    el('btn-next').focus();

    if (session.earned >= settings.goalMinutes && !session.goalShown) {
        session.goalShown = true;
        el('task-goal-banner').textContent = T.goalReached;
        el('task-goal-banner').style.display = 'block';
    }
}

function updateProgress() {
    const pct = Math.min(100, (session.earned / settings.goalMinutes) * 100);
    el('progress-fill').style.width = pct + '%';
    el('progress-label').textContent =
        `${T.earned}: ${session.earned} Min · ${T.goal}: ${settings.goalMinutes} Min`;
}

function endSession() {
    const durationMin = Math.round((Date.now() - session.started) / 60000);

    if (session.solved > 0 || session.failed > 0) {
        appendLog({
            ts: session.started,
            grade: session.grade,
            solved: session.solved,
            firstTry: session.firstTry,
            failed: session.failed,
            minutes: session.earned,
            durationMin,
            topics: session.topicCounts
        });
    }

    trackEvent('practice_complete', {
        grade: session.grade,
        solved: session.solved,
        first_try: session.firstTry,
        failed: session.failed,
        minutes: session.earned,
        duration_min: durationMin
    });

    // Summary
    el('summary-title').textContent = T.summaryTitle;
    el('summary-minutes-label').textContent = T.summaryMinutes;
    el('summary-minutes').textContent = `${session.earned} Min`;
    el('summary-tasks-label').textContent = T.summaryTasks;
    el('summary-tasks').textContent = String(session.solved);
    el('summary-firsttry-label').textContent = T.summaryFirstTry;
    el('summary-firsttry').textContent = String(session.firstTry);
    el('summary-show').textContent = T.summaryShow;
    el('btn-again').textContent = T.btnAgain;

    const topicsDiv = el('summary-topics');
    topicsDiv.innerHTML = '';
    const label = document.createElement('div');
    label.className = 'summary-topics-label';
    label.textContent = T.summaryTopics + ':';
    topicsDiv.appendChild(label);
    Object.entries(session.topicCounts).forEach(([topic, count]) => {
        const chip = document.createElement('span');
        chip.className = 'topic-chip';
        chip.textContent = `${T.topics[topic]} ×${count}`;
        topicsDiv.appendChild(chip);
    });

    showScreen('summary-screen');
    session = null;
}

// --- INIT ---

export function initPractice() {
    lang = getPreferredLanguage();
    setPreferredLanguage(lang);
    T = STRINGS[lang] || STRINGS.de;
    settings = loadSettings();

    document.title = T.title + ' - ufzgiblatt.ch';
    document.getElementById('htmlRoot').lang = lang;

    // Language links (same pattern as the geography game)
    const deLink = el('lang-de');
    const enLink = el('lang-en');
    if (deLink && enLink) {
        const active = lang === 'de' ? deLink : enLink;
        const other = lang === 'de' ? enLink : deLink;
        active.classList.add('active');
        active.href = 'javascript:void(0)';
        other.classList.remove('active');
        other.href = '?lang=' + (lang === 'de' ? 'en' : 'de');
    }

    el('btn-start').addEventListener('click', startSession);
    el('btn-check').addEventListener('click', checkAnswer);
    el('btn-next').addEventListener('click', () => {
        el('task-goal-banner').style.display = 'none';
        nextTask();
    });
    el('btn-finish').addEventListener('click', endSession);
    el('btn-again').addEventListener('click', () => {
        renderSetup();
        showScreen('setup-screen');
    });
    el('btn-clear-log').addEventListener('click', () => {
        if (confirm(T.clearLogConfirm)) {
            try { localStorage.removeItem(LOG_KEY); } catch (e) { /* ignore */ }
            renderLog();
        }
    });
    el('task-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            checkAnswer();
        }
    });

    renderSetup();
    showScreen('setup-screen');
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
}
