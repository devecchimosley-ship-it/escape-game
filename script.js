let audioCtx;
const codes = { sfida1: "135", sfida2: "6", sfida4: "780" };
let currentState = 'login';
let o2 = 25;
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
    
    // 1. Salva il testo e svuota tutti i paragrafi
    paragraphs.forEach(p => {
        if (!p.getAttribute('data-text')) {
            p.setAttribute('data-text', p.innerText); 
        }
        p.innerText = ''; 
    });

    // 2. Scrivi i paragrafi sequenzialmente
    for (let p of paragraphs) {
        // Salta il paragrafo dell'indizio se è nascosto
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
        
        await new Promise(r => setTimeout(r, 20)); // Velocità di digitazione
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

    // Attiva la digitazione narrativa
    triggerStateTyping(`state-${newState}`);

    // Gestione barra input
    const inputArea = document.getElementById('input-area');
    if (newState === 'sfida1' || newState === 'sfida2' || newState === 'sfida4') {
        inputArea.classList.add('active');
        document.getElementById('code-input').focus();
    } else {
        inputArea.classList.remove('active');
    }

    if (newState === 'sfida2') simulateReactor();
}

// GESTIONE CAPSULE (MORTE ISTANTANEA P3)
function selectCapsule(choice) {
    if (isTyping) return; // Impedisce interazioni se sta ancora scrivendo

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
        
        // Penalità di tempo (-1 Minuto) per ogni codice sbagliato
        o2 -= 1;
        updateTimerDisplay();
    }
}

// --- SISTEMA INDIZI AD ALTA TENSIONE ---
async function showHint(level) {
    if (isTyping) return;

    if (level === 1) {
        const hintBtn = document.getElementById('btn-indizio-1');
        const hintEl = document.getElementById('hint-1');
        
        // Nasconde il pulsante
        hintBtn.style.display = 'none'; 
        
        // Penalità O2
        o2 -= 1;
        updateTimerDisplay();
        
        // Suono d'allarme per l'ansia
        sounds.alarm(); 
        
        const text = ">> Sotto i tuoi piedi, il pavimento della capsula trema mentre i motori tentano un ultimo avvio.\nUn sibilo sinistro indica che la riserva dell'aria è ormai ridotta ai minimi termini.\nNon c'è più tempo per i dubbi o inserisci il codice o il vuoto reclamerà la tua anima!";
        
        hintEl.setAttribute('data-text', text);
        hintEl.style.display = 'block';
        hintEl.innerText = '';
        
        await typeText(hintEl);
    }
}

// TIMER E ALLARMI
function updateTimerDisplay() {
    const display = document.querySelector('.status');
    display.innerText = `O2_LEVEL: ${Math.max(0, Math.floor((o2/15)*100))}%`;
    if (o2 <= 5) {
        display.classList.add('critical');
        sounds.alarm();
    }
}

function startTimer() {
    timer = setInterval(() => {
        o2--;
        updateTimerDisplay();
        if (o2 <= 0) {
            clearInterval(timer);
            sounds.death();
            const deathReason = document.getElementById('death-reason');
            deathReason.setAttribute('data-text', "Livello di ossigeno a zero. Asfissia dell'equipaggio confermata.");
            changeState('sconfitta');
        }
    }, 60000); // 1 minuto reale
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
