let audioCtx;
const codes = { sfida1: "135", sfida2: "6", sfida4: "780" };
let currentState = 'login';
let totalSeconds = 25 * 60; // 25 minuti convertiti in secondi
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
    success: () => { playSfx(800, 'sine', 0.2); setTimeout(() => playSfx(1200, 0.3), 100); },
    error: () => playSfx(150, 'sawtooth', 0.6, 0.3),
    alarm: () => { playSfx(1000, 'square', 0.1, 0.05); setTimeout(() => playSfx(800, 'square', 0.1, 0.05), 150); },
    death: () => playSfx(50, 'sawtooth', 2.0, 0.5)
};

// --- TYPEWRITER EFFECT (RIGA PER RIGA) ---
async function triggerStateTyping(stateId) {
    const paragraphs = document.querySelectorAll(`#${stateId} .typewriter`);
    
    paragraphs.forEach(p => {
        if (!p.getAttribute('data-text')) {
            p.setAttribute('data-text', p.innerText); 
        }
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
        
        if (char === '\n') {
            element.innerHTML += '<br>';
        } else {
            element.innerHTML += char;
            if (char !== ' ') sounds.type();
        }
        
        await new Promise(r => setTimeout(r, 20)); 
    }
    isTyping = false;
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
    if (newState === 'sfida1' || newState === 'sfida2' || newState === 'sfida4') {
        inputArea.classList.add('active');
        document.getElementById('code-input').focus();
    } else {
        inputArea.classList.remove('active');
    }

    if (newState === 'sfida2') simulateReactor();
}

// GESTIONE CAPSULE 
function selectCapsule(choice) {
    if (isTyping) return; 

    // FIX LOGICO: La risposta esatta in base al testo è la B, non la A.
    if (choice === 'A') {
        sounds.success();
        changeState('sfida4');
    } else {
        sounds.death();
        clearInterval(timer);
        
        const deathReason = document.getElementById('death-reason');
        deathReason.setAttribute('data-text', `ERRORE CRITICO: La capsula ${choice} era compromessa. Decompressione hangar avvenuta. Equipaggio eliminato.`);
        deathReason.classList.add('typewriter');
        
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
            changeState('vittoria');
        }
    } else {
        sounds.error();
        document.getElementById('code-input').value = '';
        
        // Penalità di tempo (-60 secondi) per ogni codice sbagliato
        totalSeconds -= 60;
        updateTimerDisplay();
        checkTimeLimit();
    }
}

// --- SISTEMA INDIZI AD ALTA TENSIONE ---
async function showHint(level) {
    if (isTyping) return;

    if (level === 1) {
        const hintBtn = document.getElementById('btn-indizio-1');
        const hintEl = document.getElementById('hint-1');
        
        hintBtn.style.display = 'none'; 
        
        // Penalità O2 (-300 secondi / 5 min)
        totalSeconds -= 300;
        updateTimerDisplay();
        sounds.alarm(); 
        
        // FIX SINTASSI: rimosso il ">;" alla fine della stringa
        const text = ">> Sotto i tuoi piedi, il pavimento della capsula trema mentre i motori tentano un ultimo avvio.\nUn sibilo sinistro indica che la riserva dell'aria è ormai ridotta ai minimi termini.\nNon c'è più tempo per i dubbi o inserisci il codice o il vuoto reclamerà la tua anima!\n Leggi le maiuscole";
        
        hintEl.setAttribute('data-text', text);
        hintEl.style.display = 'block';
        hintEl.innerText = '';
        
        await typeText(hintEl);
        checkTimeLimit();
    }
}

// TIMER E ALLARMI (Rifatto per funzionare al secondo)
function checkTimeLimit() {
    if (totalSeconds <= 0) {
        totalSeconds = 0;
        clearInterval(timer);
        sounds.death();
        const deathReason = document.getElementById('death-reason');
        deathReason.setAttribute('data-text', "Livello di ossigeno a zero. Asfissia dell'equipaggio confermata.");
        changeState('sconfitta');
    }
}

function updateTimerDisplay() {
    const o2Display = document.querySelector('.status');
    const timeDisplay = document.querySelector('.time');
    
    // Calcolo % O2 (25 minuti * 60 = 1500 sec totali originali)
    let percentage = Math.max(0, Math.floor((totalSeconds / 1500) * 100));
    o2Display.innerText = `O2_LEVEL: ${percentage}%`;
    
    // Formattazione MM:SS
    let minutes = Math.floor(Math.max(0, totalSeconds) / 60);
    let seconds = Math.max(0, totalSeconds) % 60;
    timeDisplay.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (percentage <= 20) { // Allarme se si scende sotto i 5 minuti
        o2Display.classList.add('critical');
        timeDisplay.classList.add('critical'); // Lampeggia anche il timer
    }
}

function startTimer() {
    updateTimerDisplay(); // Mostra i 25 minuti iniziali subito
    timer = setInterval(() => {
        totalSeconds--;
        updateTimerDisplay();
        
        // Piccolo allarme periodico quando si è in zona critica (sotto i 5 min)
        if (totalSeconds > 0 && totalSeconds <= 300 && totalSeconds % 10 === 0) {
            sounds.alarm();
        }
        
        checkTimeLimit();
    }, 1000); // 1 secondo reale
}

function simulateReactor() {
    const el = document.querySelector('.reattore-val');
    if(el) {
        setInterval(() => { if(currentState === 'sfida2') el.innerText = Math.floor(Math.random() * 900 + 100); }, 100);
    }
}

// EVENTS
document.getElementById('login-btn').addEventListener('click', () => {
    initAudio();
    changeState('intro');
});

document.querySelector('.start-btn').addEventListener('click', () => {
    changeState('sfida1');
    startTimer();
});

document.getElementById('submit-code').addEventListener('click', checkCode);
document.getElementById('code-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkCode();
});
