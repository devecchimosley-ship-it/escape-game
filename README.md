ICARUS-7: TERMINALE DI EMERGENZA 🚀
ICARUS-7 è un'esperienza di Escape Game digitale ambientata in una stazione spaziale alla deriva. I giocatori devono interagire con un terminale in stile retro-CRT per risolvere enigmi logici e tecnici prima che l'ossigeno si esaurisca.

📝 Descrizione del Progetto
Il gioco simula un guasto critico a bordo della stazione spaziale Icarus-7. L'intelligenza artificiale di bordo, AURA, è entrata in modalità di sicurezza estrema. L'equipaggio ha 20 minuti per superare 4 protocolli di sicurezza e raggiungere le capsule di salvataggio.

Caratteristiche principali:
Interfaccia Terminale CRT: Estetica hacker anni '80 con effetti scanline, glitch e tipografia "typewriter".

Audio Dinamico: Motore audio integrato che genera suoni sintetizzati (beeps, allarmi, feedback di digitazione) tramite Web Audio API.

Sistema di Classifica: Salvataggio dei record locali (Team e tempo residuo) tramite localStorage.

Meccaniche di Gioco: Gestione del tempo reale (O2), penalità per errori e sistema di indizi con costo in termini di tempo.

🛠️ Tecnologie Utilizzate
HTML5: Struttura semantica per le varie fasi (stati) del terminale.

CSS3: Animazioni avanzate per effetti glitch, pulsazioni d'emergenza e layout responsive.

JavaScript (Vanilla): Motore di gioco per la gestione degli stati, timer, logica degli enigmi e persistenza dati.

🕹️ Come Giocare
Login: Inserisci il nome della tua squadra e il numero dei membri.

Protocollo 1 (Sigillo d'ingresso): Risolvi l'enigma testuale e converti la soluzione in un codice numerico.

Protocollo 2 (Nucleo Reattore): Stabilizza il nucleo calcolando la frequenza di risonanza corretta.

Protocollo 3 (Analisi Capsule): Usa la logica deduttiva per identificare l'unica capsula sicura tra le tre disponibili.

Protocollo 4 (Coordinate Terrestri): Risolvi un sistema di equazioni logiche e matematiche per sbloccare il portellone finale.

⚙️ Configurazione per Sviluppatori
Password di Amministrazione
Il sistema include un'area amministratore nella schermata della classifica per resettare il database locale.


Modifica dei codici
I codici delle sfide possono essere modificati nell'oggetto codes all'interno del file script.js:

JavaScript
const codes = { sfida1: "135", sfida2: "6", sfida4: "780" }; //
🚀 Installazione
Non è richiesta alcuna installazione o dipendenza esterna.

Clona la repository.

Apri il file index.html in un browser moderno.
