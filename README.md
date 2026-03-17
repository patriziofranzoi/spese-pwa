# 💶 Gestione Spese PWA

Progressive Web App per la gestione delle spese giornaliere.  
Installabile su Android direttamente dal browser.

## Funzionalità
- Data automatica (modificabile)
- Importo in euro
- Tipo pagamento: Contanti, Bancomat (Mio/Condiviso/Papà), Bonifico, Hype, Satispay, Altro
- Tipologia: Spesa, Rifornimento, Altro
- Foto da galleria o fotocamera per ogni spesa
- Riepilogo totale per tipo pagamento
- Salvataggio locale (localStorage)
- Aggiornamento automatico via GitHub Pages + Service Worker
- Numero versione in basso a destra
- Popup di notifica aggiornamento

## Come aggiornare l'app
1. Modifica i file sorgente
2. Aggiorna `CACHE_NAME` in `sw.js` (es. `spese-pwa-v1.0.1`)
3. Aggiorna `version.js` con nuova versione e data
4. Fai `git push` su `main`
5. GitHub Pages si aggiorna automaticamente
6. L'utente vede il banner di aggiornamento alla prossima apertura

## Setup iniziale GitHub Pages
1. Crea repo su GitHub
2. Carica tutti i file
3. Vai su **Settings → Pages → Source: GitHub Actions**
4. Aggiungi un'icona PNG in `icons/icon-192.png` e `icons/icon-512.png`
5. L'app sarà disponibile su `https://TUO-USERNAME.github.io/NOME-REPO/`

## Installazione su Android
1. Apri l'URL nel browser Chrome
2. Tocca i tre puntini → "Aggiungi alla schermata Home"
3. L'app si installa come app nativa
