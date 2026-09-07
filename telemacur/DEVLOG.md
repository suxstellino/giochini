# Devlog — Telemacur: la Missione Finishinis

## Scelte tecniche
- **Canvas 2D + JS puro (ES modules)**, niente Phaser: la fisica necessaria (runner con
  salto, poi un platform a piattaforme temporizzate nel boss finale) e' semplice
  (AABB, gravita' costante) e non giustifica una libreria/dipendenza CDN in piu'. Canvas
  puro da' controllo diretto sul disegno pixel-per-pixel per generare gli sprite via
  codice, e gira da un server statico senza build.
- Sprite pixel-art generati a runtime da griglie testuali (`engine/Pixel.js` ->
  `buildSprite` + `row`), palette condivisa e ridotta (`sprites/palettes.js`, ~55 colori
  totali su tutto il gioco, ma ogni sprite ne usa 4-6).
- Fondali a parallasse procedurali e deterministici (stesso seed = stesso fondale ogni
  partita) in `sprites/backgrounds.js`.
- Salvataggio su `localStorage` (`engine/SaveManager.js`): missione sbloccata, stadio
  navicella, monete totali, compagni di viaggio uniti.

## Fase 1 — Motore base + menu + missione Luna (COMPLETATA)
Cosa c'e':
- Loop di gioco, input a un tasto (spazio / freccia su / tap), canvas 960x540 pixelato.
- Menu con titolo, navicella allo stadio corrente (motori animati), avvio/ripresa
  partita, reset progressi (tasto R).
- Missione Luna giocabile: scorrimento automatico, salto, ostacoli procedurali (rocce e
  crateri), monete gialle, velocita' che cresce molto gradualmente, HUD con contatori,
  game over con retry sulla stessa missione, obiettivo 20 monete gialle.
- Fondale Luna a 3 livelli di parallasse + Terra lontana + stelle, niente atmosfera.
- Cutscene di fine missione: la navicella passa dallo stadio "Base" a "Razzi laterali",
  poi schermata di transizione verso Venere (che segnala "arrivera' in una prossima
  fase" perche' non ancora implementata).
- Sprite pronti anche per le fasi successive (tutti e 6 gli stadi navicella, Agri,
  Scalino, Gasolio, Acquazzone, Benzo, Luciastro) cosi' le fasi 2-3 non dovranno
  toccare l'architettura degli sprite.
- Beep sintetizzati via Web Audio per salto/moneta/urto/vittoria (la rifinitura audio
  vera e propria e' pianificata in Fase 4, ma senza feedback sonoro minimo il runner
  sembrava scollegato).

Cosa manca (fasi successive):
- Missioni Venere/Marte/Saturno/Nettuno (Fase 2): richiedono solo nuove voci in
  `data/missions.js` (background, colori ostacoli, obiettivo, coinSpawn) piu' le scene
  di dialogo con Agri/Scalino/Gasolio/Acquazzone (nuova `DialogueScene.js`).
- Boss finale su Finishinis, cutscene apertura/chiusura, fuga a tempo, epilogo (Fase 3).
- Rifinitura audio/UI, salvataggi piu' robusti tra missioni (Fase 4) — il salvataggio
  base gia' persiste missione sbloccata/navicella/monete, ma andra' esteso quando
  arriveranno i compagni e gli obiettivi con diamanti.

## Fase 2 — Missioni Venere, Marte, Saturno, Nettuno (COMPLETATA)
Cosa c'e':
- Le 4 missioni sullo stesso motore di RunnerScene, solo parametri diversi in
  `data/missions.js`: obiettivo (blu / miste / miste+diamanti), pesi di generazione
  monete, velocita', colori ostacoli, messaggio di fine missione, stadio navicella.
- 4 nuovi fondali a parallasse in `sprites/backgrounds.js`, coerenti con la richiesta:
  Venere (foschia gialla/arancio a strati, silhouette rocciose), Marte (dune, canyon,
  tempesta di sabbia leggera), Saturno (superficie ghiacciata + anelli enormi come
  "oggetto lontano" con parallasse propria), Nettuno (aurore ondulate, venti stilizzati
  che scorrono piu' veloci di tutto il resto, per richiamare le tempeste piu' violente
  del sistema solare).
- Da Venere in poi gli ostacoli includono anche una creatura aliena semplice (stessa
  forma, colori diversi per pianeta) accanto a rocce e crateri.
- `DialogueScene.js`: scena di dialogo generica (ritratto NPC + box di testo, 2-3
  battute) riusata per Agri, Scalino, Gasolio, Acquazzone. Il flusso in `main.js' e'
  ora: RunnerScene vinta -> (se la missione ha un NPC) DialogueScene -> TransitionScene
  con potenziamento navicella -> missione successiva.
- Scalino, dopo Marte, si unisce davvero: compare come piccolo sprite che trotterella
  dietro a Telemacur in tutte le missioni successive (Saturno, Nettuno), non solo
  un'icona statica nell'HUD.
- Obiettivo diamanti su Nettuno: sbloccati solo dopo un tempo minimo dall'inizio della
  missione (`diamondsAfterSeconds`), cosi' compaiono rari e verso la seconda meta' del
  livello come richiesto, invece che fin dal primo secondo.
- Verificato l'intero percorso Luna -> Venere -> Marte -> Saturno -> Nettuno -> (Finishinis
  ancora bloccata, si torna al menu) senza errori: catena di dialoghi, transizioni,
  potenziamenti navicella (fino allo stadio "Teletrasporto") e flag compagni tutti
  corretti a fine partita.

Bug trovato e corretto in Fase 1 durante i test di questa fase (non dipendeva dalle
nuove missioni, ma e' emerso rigiocando dal menu dopo aver completato la Luna): il menu
puntava sempre a "prossima missione sbloccata" anche se non ancora implementata,
mandando in crash il gioco. Corretto in `MenuScene.js` con `resolvePlayableMissionId()`,
che riparte dall'ultima missione realmente giocabile.

Cosa manca (fasi successive):
- Boss finale su Finishinis, cutscene apertura/chiusura, fuga a tempo, epilogo (Fase 3).
- Rifinitura audio/UI (Fase 4).

## Fase 3 — Boss finale su Finishinis + cutscene apertura/chiusura (COMPLETATA)
Cosa c'e':
- Cutscene di apertura (3 schermate, `CutsceneScene.js` + `data/finale.js`), mostrata una
  sola volta alla primissima partita (flag `introSeen` in `SaveManager`): Napoli, il
  segnale d'aiuto, la partenza di Telemacur.
- La missione 'finishinis' non e' un runner: `main.js` la riconosce (`mission.isFinale`)
  e avvia una sequenza dedicata invece di `RunnerScene`.
- Scena 1 (Terra/Benzo): riusa `DialogueScene.js` per il dialogo, poi una cutscene di
  partenza a 2 schermate verso il sistema di Andromeda.
- Scena 2 (`BossScene.js`): boss a piattaforme sopra un lago di lava. Nota di design
  importante — con un solo tasto in tutto il gioco, non e' possibile sia "puntare" un
  salto a distanza/altezza variabili sia rispettare il ritmo a tempo richiesto dalla
  specifica. Ho risolto cosi': il giocatore resta fermo sulla piattaforma corrente: il
  tasto azione lancia un salto automatico (sempre riuscito) verso la piattaforma
  successiva, che appare solo all'atterraggio su quella attuale come richiesto; il
  timer di 3 secondi per piattaforma resta esattamente quello della specifica ed e' la
  vera fonte di tensione (decidere QUANDO saltare, non DOVE). La "difficolta' crescente"
  si vede nella durata/altezza dell'arco del salto e nel restringersi delle piattaforme,
  non nel rischio di un salto sbagliato. 15 piattaforme + una piattaforma sicura di
  partenza + una piattaforma finale sicura con la leva per sconfiggere Luciastro. Cadere
  nella lava (piattaforma che si rompe mentre ci si e' ancora sopra) fa ripartire il
  boss dall'inizio, come richiesto.
- Scena 3 (`EscapeScene.js`): fuga a tempo (30s), si tiene premuto il tasto azione per
  correre (stesso tasto, usato qui per "vai avanti" invece che per saltare) verso l'arma
  di Luciastro e poi verso la navicella, con detriti e tremore visivi. Timeout = si
  riparte dall'inizio della scena, come richiesto.
- Scena 4: epilogo non interattivo a 4 schermate (`data/finale.js`): ritorno a Napoli,
  pizza con l'arma in mano, "La Terra e' salva.", crediti minimi. Poi si torna al menu.
- Nuovi sprite (`sprites/propSprites.js`): l'arma di Luciastro, la leva del boss, la
  pizza (disegnata con cerchi invece che a griglia, essendo tonda). Nuovo fondale
  Finishinis (cielo rossastro/violaceo diverso da tutti gli altri pianeti, laghi di
  lava, piattaforme scure fluttuanti) e fondale Napoli (skyline + Vesuvio) in
  `sprites/backgrounds.js`.
- Verificato senza errori: apertura -> Luna; e Benzo -> partenza -> boss (progressione,
  leva, sconfitta, caduta/game over/retry) -> fuga (raccolta arma, successo,
  timeout/retry) -> epilogo (tutte le 4 schermate) -> menu.

Cosa manca (fase finale):
- Rifinitura audio/UI complessiva (Fase 4) — il gioco e' completo e giocabile da cima a
  fondo, resta solo la passata di lucidatura.

## Fase 4 — Rifinitura audio/UI/salvataggi (COMPLETATA)
Il gioco era gia' completo e giocabile dopo la Fase 3; questa fase e' rifinitura, non
nuove funzionalita':
- Icona altoparlante sempre visibile in alto a destra, su ogni schermata (menu, missioni,
  dialoghi, boss, fuga, cutscene): tasto **M** o tocco/click sull'icona stessa per
  attivare/disattivare tutti i suoni. Preferenza salvata (`soundOn` in `SaveManager`) e
  ripristinata al prossimo avvio. Il click sull'icona e' filtrato in `Input.js` prima
  che diventi un "tocco azione", altrimenti disattivare l'audio avrebbe anche fatto
  saltare Telemacur o avanzare un dialogo.
- Dissolvenza breve (circa un quarto di secondo) ad ogni cambio scena
  (`SceneManager.js`), cosi' i tagli tra missione/dialogo/transizione non sono piu' a
  scatto secco.
- HUD del runner: le monete gialle/blu/i diamanti ora si mostrano con la loro vera
  icona pixel-art invece dei caratteri unicode ●/◆, coerente con il resto della grafica.
- Menu principale: mostra "Continua da: <pianeta>" (o "Prossima missione" a partita
  appena iniziata) cosi' e' chiaro cosa succede premendo SPAZIO, invece di scoprirlo
  solo dopo.
- Il salvataggio (missione sbloccata, stadio navicella, monete totali, compagni,
  cutscene di apertura vista, preferenza audio) era gia' persistente dalla Fase 1 in
  poi; qui e' stato solo esteso con `soundOn` — l'architettura non ha richiesto altro,
  segno che il checkpoint-tra-missioni era gia' impostato bene fin dall'inizio.

Il gioco e' considerato completo per tutte e 4 le fasi richieste.

## Modifiche su richiesta: boss finale piu' difficile e articolato
Il boss e la fuga sono stati rivisti su richiesta diretta (non un'interpretazione mia):
- Le piattaforme si rompono dopo **2 secondi** invece di 3.
- Nel varco tra una piattaforma e la successiva sale e scende una **palla di lava**
  (periodo ~1.7s): saltare mentre e' in alto costa la partita. E' evitabile saltando
  subito dopo l'atterraggio, quando e' ancora bassa — non e' un ostacolo a caso, premia
  chi osserva il ritmo prima di saltare.
- I razzi di Luciastro NON sono piu' un pericolo sul pianeta (rimossi da `BossScene.js`):
  su richiesta successiva, appaiono solo come scenografia nella cutscene di partenza
  (`data/finale.js`, slide "nave nello spazio"), dove sfrecciano sullo sfondo senza
  poter colpire nulla.
- Dopo la 15a piattaforma non c'e' piu' una leva: si entra in un'**arena di tiro**.
  Luciastro sale e scende a velocita' casuale (cambia ogni 0.8-1.8s); il tasto azione
  spara un colpo che viaggia sempre alla stessa altezza (quella di partenza) — bisogna
  aspettare che Luciastro sia allineato, non si puo' mirare con un solo tasto. 5 colpi
  per sconfiggerlo. Nota tecnica: il controllo del colpo verifica il tratto percorso nel
  frame (non solo la posizione istantanea), altrimenti ad alta velocita' un proiettile
  puo' "bucare" la fascia di tiro tra un frame e l'altro senza mai risultare a contatto.
- La fuga finale (`EscapeScene.js`) ora ha **10 secondi** invece di 30, la navicella e'
  molto piu' lontana (da x=700 a x=1500 in coordinate di mondo) e piovono **meteoriti**
  con un breve preavviso (ombra pulsante + sasso in caduta) che, se non schivati fermandosi
  un istante, fanno fallire la fuga. Rimossa la raccolta dell'arma a meta' strada: dato
  che ora la si usa gia' per sparare a Luciastro, farla anche raccogliere dopo non aveva
  piu' senso narrativo.

## Nota per chi sviluppa
`devserver.py` e' un server statico identico a `python -m http.server` ma disabilita la
cache del browser: utile solo durante lo sviluppo, quando si modifica il codice e si
vuole vedere subito l'effetto senza incappare in risposte 304 con contenuto vecchio.
Per giocare normalmente va benissimo `python -m http.server` come indicato nel README.

## Decisioni prese per ambiguita' del documento originale
- Le monete raccolte durante un tentativo fallito NON vengono accreditate al totale
  salvato: solo al completamento della missione i contatori dell'obiettivo vengono
  sommati al totale persistente. Altrimenti "ripartire dalla missione corrente" dopo un
  game over avrebbe permesso di accumulare monete infinite ripetendo lo stesso tratto.
- Le monete non richiedono per forza un salto per essere raccolte (appaiono ad altezze
  variabili): l'unica azione con il tasto singolo e' schivare gli ostacoli, per restare
  fedeli alla richiesta "endless runner stile Dino di Google".
