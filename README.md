# DocScan AI

DocScan AI è un MVP di document intelligence per analizzare immagini di scontrini, fatture, contratti e documenti di identità, ed estrarre i dati in JSON strutturato tramite AI.

Il progetto è stato realizzato come candidatura per Mamazen ed è pensato per mostrare un flusso completo: upload del documento, estrazione tramite modello selezionabile, visualizzazione strutturata dei risultati e storico di sessione.

## Funzionalità

- Upload drag & drop o selezione file da filesystem
- Supporto immagini `JPG`, `PNG`, `WebP` e `HEIC`
- Modalità demo senza API key, con risultati realistici simulati
- Estrazione dati tramite OpenRouter con modello selezionabile
- Output strutturato in JSON con schema tipizzato
- Classificazione automatica del tipo di documento
- Estrazione di vendor, importi, IVA, data, metodo di pagamento, lingua e righe articolo
- Preview del documento caricato
- Copia del JSON raw negli appunti
- Storico delle estrazioni nella sessione corrente con statistiche aggregate
- UI dark premium con effetto glassmorphism e feedback visivi
- Retry automatico in caso di rate limit del provider

## Stack Tecnico

- Next.js 16 App Router
- React 19
- TypeScript
- CSS vanilla con variabili globali e componenti custom
- OpenRouter API via SDK `openai`
- `lucide-react` per le icone

## Requisiti

- Node.js 20 o superiore
- npm
- Una OpenRouter API key se vuoi usare l’estrazione reale

## Installazione

```bash
npm install
```

## Avvio in locale

```bash
npm run dev
```

L’app sarà disponibile su `http://localhost:3000`.

## Build di produzione

```bash
npm run build
npm run start
```

## Lint

```bash
npm run lint
```

## Configurazione

### Modalità demo

Se non inserisci alcuna API key, l’app entra automaticamente in modalità demo e genera un risultato realistico simulato. È utile per presentare il prodotto o provarne il flusso senza credenziali.

### Modalità reale con OpenRouter

1. Apri la sezione **Impostazioni** nell’app
2. Inserisci la tua OpenRouter API key
3. Seleziona il modello AI desiderato
4. Torna su **Analizza Documento** e carica un’immagine

Modelli disponibili nell’interfaccia:

- `google/gemini-3-flash-preview`
- `nvidia/nemotron-nano-12b-v2-vl:free`
- `anthropic/claude-3.5-haiku`

## Come funziona

1. L’utente carica un’immagine del documento
2. Il file viene convertito in base64 lato client
3. Il client invia la richiesta alla route `POST /api/extract`
4. Il server chiama OpenRouter con uno schema di output rigido
5. La risposta JSON viene parsata e mostrata nell’interfaccia
6. Il risultato viene salvato nello storico di sessione

## Schema dei dati estratti

Il payload estratto include:

- tipo documento
- nome fornitore
- indirizzo fornitore
- partita IVA
- data e ora
- importo totale
- valuta
- imponibile
- IVA e aliquota
- metodo di pagamento
- numero fattura
- righe articolo
- note
- livello di confidenza
- lingua del documento
- sommario testuale grezzo

## API Route

La logica di estrazione è implementata in [app/api/extract/route.ts](app/api/extract/route.ts).

La route:

- accetta `imageBase64`, `mimeType`, `apiKey` e `model`
- invia il prompt al provider OpenRouter
- forza un output JSON valido
- gestisce errori di autenticazione, rate limit e parsing

## Struttura del progetto

```text
mvp/
├── app/
│   ├── api/
│   │   └── extract/
│   │       └── route.ts
│   ├── components/
│   │   ├── HistoryView.tsx
│   │   ├── ResultPanel.tsx
│   │   ├── SettingsView.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Toast.tsx
│   │   └── UploadView.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── types.ts
├── public/
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── README.md
```

## Script disponibili

| Script | Descrizione |
| --- | --- |
| `npm run dev` | Avvia il server di sviluppo |
| `npm run build` | Compila l’app per produzione |
| `npm run start` | Avvia la build di produzione |
| `npm run lint` | Esegue ESLint sul codice |

## Note operative

- Il progetto salva la API key solo in memoria lato UI per la sessione corrente.
- Lo storico è locale alla sessione del browser e non persiste su database.
- In caso di rate limit, il client attende e ritenta automaticamente.
- L’estrazione è progettata per evitare valori inventati: i campi non visibili vengono restituiti come `null`.

## Deploy

Il progetto è pronto per essere distribuito su Vercel senza configurazioni complesse.

1. Carica il repository su GitHub
2. Collega il repo a Vercel
3. Esegui il deploy

Se vuoi usare l’app in modalità reale, inserisci la API key direttamente dall’interfaccia in **Impostazioni**.

## Obiettivo del progetto

Questo MVP dimostra un flusso end-to-end di document intelligence con focus su:

- UX chiara e immediata
- affidabilità dell’output strutturato
- gestione dei casi limite
- presentazione del risultato in modo leggibile e professionale
