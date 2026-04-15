let audioCtx;
const codes = { sfida1: "135", sfida2: "6", sfida4: "780" };
const ADMIN_PASS = "mosley0789"; // Password richiesta per il reset
let currentState = 'login';
let totalSeconds = 20 * 60; 
let timer;
let isTyping = false;

// --- AUDIO ENGINE ---
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSfx(freq, type, dur, vol = 0.1) {
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

const sounds = {
    type: () => playSfx(Math.random() * 100 + 600, 'square', 0.05, 0.01),
    success: () => { playSfx(800, 'sine', 0.2); setTimeout(() => playSfx(1200, 'sine', 0.3), 100); },
    error: () => playSfx(150, 'sawtooth', 0.6, 0.3),
    alarm: () => { playSfx(1000, 'square', 0.1, 0.05); setTimeout(() => playSfx(800, 'square', 0.1, 0.05), 150); },
    death: () => playSfx(50, 'sawtooth', 2.0, 0.5)
};

// --- TYPEWRITER EFFECT ---
async function triggerStateTyping(stateId) {
    const paragraphs = document.querySelectorAll(`#${stateId} .typewriter`);
    paragraphs.forEach(p => {
        if (!p.getAttribute('data-text')) p.setAttribute('data-text', p.innerText); 
        p.innerText = ''; 
    });
    for (let p of paragraphs) {
        if (p.id.startsWith('hint-') && p.style.display === 'none') continue;
        await typeText(p);
    }
}

async function typeText(element) {
    isTyping = true;
    const text = element.getAttribute('data-text');
    for (let i = 0; i < text.length; i++) {
        const char = text.charAt(i);
        if (char === '\n') element.innerHTML += '<br>';
        else {
            element.innerHTML += char;
            if (char !== ' ') sounds.type();
        }
        await new Promise(r => setTimeout(r, 20)); 
    }
    isTyping = false;
}

// --- CLASSIFICA LOGIC ---
function saveRecord(teamName, timeLeft) {
    let leaderboard = JSON.parse(localStorage.getItem('icarus_records')) || [];
    leaderboard.push({ name: teamName, time: timeLeft });
    leaderboard.sort((a, b) => b.time - a.time); // Ordina per tempo residuo maggiore
    leaderboard = leaderboard.slice(0, 5); // Tieni i primi 5
    localStorage.setItem('icarus_records', JSON.stringify(leaderboard));
}

function displayLeaderboard() {
    const listEl = document.getElementById('leaderboard-list');
    const leaderboard = JSON.parse(localStorage.getItem('icarus_records')) || [];
    if (leaderboard.length === 0) {
        listEl.innerText = "NESSUN RECORD RILEVATO NEL DATABASE.";
    } else {
        let html = "<div style='text-align: left; font-family: monospace;'>";
        leaderboard.forEach((entry, index) => {
            let min = Math.floor(entry.time / 60);
            let sec = entry.time % 60;
            html += `${index + 1}. ${entry.name.padEnd(15, '_')} O2 RESIDUO: ${min}:${sec.toString().padStart(2, '0')}<br>`;
        });
        html += "</div>";
        listEl.innerHTML = html;
    }
}

// --- CORE LOGIC ---
function changeState(newState) {
    const current = document.querySelector('.terminal-state.active');
    if (current) current.classList.remove('active');
    const next = document.getElementById(`state-${newState}`);
    next.classList.add('active');
    currentState = newState;
    triggerStateTyping(`state-${newState}`);

    const inputArea = document.getElementById('input-area');
    if (['sfida1', 'sfida2', 'sfida4'].includes(newState)) {
        inputArea.classList.add('active');
        document.getElementById('code-input').focus();
    } else {
        inputArea.classList.remove('active');
    }
    if (newState === 'sfida2') simulateReactor();
    if (newState === 'classifica') displayLeaderboard();
}

function selectCapsule(choice) {
    if (isTyping) return; 
    if (choice === 'A') { // Nel tuo script originale la risposta corretta era impostata su A
        sounds.success();
        changeState('sfida4');
    } else {
        sounds.death();
        clearInterval(timer);
        const deathReason = document.getElementById('death-reason');
        deathReason.setAttribute('data-text', `ERRORE CRITICO: La capsula ${choice} era compromessa. Decompressione hangar avvenuta.`);
        changeState('sconfitta');
    }
}

function checkCode() {
    if (isTyping) return;
    const val = document.getElementById('code-input').value.trim().toUpperCase();
    if (val === codes[currentState]) {
        sounds.success();
        document.getElementById('code-input').value = '';
        if (currentState === 'sfida1') changeState('sfida2');
        else if (currentState === 'sfida2') changeState('sfida3');
        else if (currentState === 'sfida4') {
            clearInterval(timer);
            const team = document.getElementById('team-name').value || "SCONOSCIUTO";
            saveRecord(team, totalSeconds);
            changeState('vittoria');
        }
    } else {
        sounds.error();
        document.getElementById('code-input').value = '';
        totalSeconds -= 60;
        updateTimerDisplay();
        checkTimeLimit();
    }
}

async function showHint(level) {
    if (isTyping) return; // Evita bug se il testo sta ancora scrivendo
    
    if (level === 1) {
        // 1. Nascondi il pulsante per evitare doppie attivazioni
        document.getElementById('btn-indizio-1').style.display = 'none';
        
        // 2. Detrai il tempo (5 minuti = 300 secondi)
        totalSeconds -= 300;
        updateTimerDisplay();
        sounds.alarm(); 

        // 3. Prepara il testo del suggerimento
        const hintEl = document.getElementById('hint-1');
        const hintText = ">> ANALISI SISTEMA: La soluzione dell'enigma è il SOLE. In inglese si scrive 'SUN'. S=19, U=21, N=14.";
        
        // 4. Mostra e avvia l'effetto macchina da scrivere
        hintEl.setAttribute('data-text', hintText);
        hintEl.style.display = 'block';
        hintEl.innerText = ''; // Pulisce il testo prima di scrivere
        await typeText(hintEl);
        
        checkTimeLimit();
    }
}

function updateTimerDisplay() {
    const o2Display = document.querySelector('.status');
    const timeDisplay = document.querySelector('.time');
    let percentage = Math.max(0, Math.floor((totalSeconds / 1200) * 100));
    o2Display.innerText = `O2_LEVEL: ${percentage}%`;
    let minutes = Math.floor(Math.max(0, totalSeconds) / 60);
    let seconds = Math.max(0, totalSeconds) % 60;
    timeDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    if (percentage <= 20) {
        o2Display.classList.add('critical');
        timeDisplay.classList.add('critical');
    }
}

function checkTimeLimit() {
    if (totalSeconds <= 0) {
        clearInterval(timer);
        sounds.death();
        document.getElementById('death-reason').setAttribute('data-text', "Livello di ossigeno a zero. Asfissia confermata.");
        changeState('sconfitta');
    }
}

function startTimer() {
    updateTimerDisplay();
    timer = setInterval(() => {
        totalSeconds--;
        updateTimerDisplay();
        if (totalSeconds <= 300 && totalSeconds % 10 === 0) sounds.alarm();
        checkTimeLimit();
    }, 1000);
}

function simulateReactor() {
    const el = document.querySelector('.reattore-val');
    if(el) {
        const rInterval = setInterval(() => { 
            if(currentState !== 'sfida2') clearInterval(rInterval);
            else el.innerText = Math.floor(Math.random() * 900 + 100); 
        }, 100);
    }
}

// --- EVENT LISTENERS ---
document.getElementById('login-btn').addEventListener('click', () => {
    initAudio();
    changeState('intro');
});

document.querySelector('.start-btn').addEventListener('click', () => {
    changeState('sfida1');
    startTimer();
});

document.getElementById('submit-code').addEventListener('click', checkCode);
document.getElementById('code-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') checkCode(); });

document.getElementById('view-leaderboard-btn').addEventListener('click', () => {
    changeState('classifica');
});

document.getElementById('reset-btn').addEventListener('click', () => {
    const pass = document.getElementById('admin-pass').value;
    if (pass === ADMIN_PASS) {
        localStorage.removeItem('icarus_records');
        alert("DATABASE RESETTATO.");
        displayLeaderboard();
        document.getElementById('admin-pass').value = '';
    } else {
        sounds.error();
        alert("PASSWORD ERRATA.");
    }
});
