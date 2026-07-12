# DocScan AI

DocScan AI is a document intelligence MVP for analyzing images of receipts, invoices, contracts, and identity documents, and extracting the data into structured JSON with AI.

The project was built as an application for Mamazen and is designed to demonstrate a complete flow: document upload, extraction through a selectable model, structured result visualization, and session history.

## Features

- Drag & drop upload or file picker support
- Image support for `JPG`, `PNG`, `WebP`, and `HEIC`
- Demo mode with no API key required and realistic simulated results
- Data extraction through OpenRouter with selectable models
- Structured JSON output with a typed schema
- Automatic document type classification
- Extraction of vendor details, amounts, VAT, dates, payment method, language, and line items
- Document preview
- Copy raw JSON to clipboard
- Session-based extraction history with aggregate stats
- Premium dark UI with glassmorphism effects and visual feedback
- Automatic retry on provider rate limits

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Vanilla CSS with global variables and custom components
- OpenRouter API via the `openai` SDK
- `lucide-react` for icons

## Requirements

- Node.js 20 or newer
- npm
- An OpenRouter API key if you want to use real extraction

## Installation

```bash
npm install
```

## Local Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run start
```

## Linting

```bash
npm run lint
```

## Configuration

### Demo Mode

If you do not provide an API key, the app automatically switches to demo mode and generates a realistic simulated result. This is useful for presenting the product or trying the flow without credentials.

### Real Mode with OpenRouter

1. Open the **Settings** section in the app
2. Enter your OpenRouter API key
3. Select the desired AI model
4. Go back to **Analyze Document** and upload an image

Available models in the interface:

- `google/gemini-3-flash-preview`
- `nvidia/nemotron-nano-12b-v2-vl:free`
- `anthropic/claude-3.5-haiku`

## How It Works

1. The user uploads a document image
2. The file is converted to base64 on the client
3. The client sends the request to `POST /api/extract`
4. The server calls OpenRouter with a strict output schema
5. The JSON response is parsed and displayed in the UI
6. The result is stored in the session history

## Extracted Data Schema

The extracted payload includes:

- document type
- vendor name
- vendor address
- VAT number
- date and time
- total amount
- currency
- subtotal
- VAT amount and tax rate
- payment method
- invoice number
- line items
- notes
- confidence score
- document language
- raw text summary

## API Route

The extraction logic is implemented in [app/api/extract/route.ts](app/api/extract/route.ts).

The route:

- accepts `imageBase64`, `mimeType`, `apiKey`, and `model`
- sends the prompt to OpenRouter
- enforces valid JSON output
- handles authentication, rate limit, and parsing errors

## Project Structure

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

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Starts the development server |
| `npm run build` | Builds the app for production |
| `npm run start` | Starts the production build |
| `npm run lint` | Runs ESLint on the codebase |

## Operational Notes

- The API key is stored only in memory in the UI for the current session.
- History is local to the browser session and is not persisted to a database.
- In case of rate limiting, the client waits and retries automatically.
- The extraction flow is designed to avoid invented values: fields that are not visible are returned as `null`.

## Deployment

The project is ready to be deployed on Vercel with minimal configuration.

1. Push the repository to GitHub
2. Connect the repository to Vercel
3. Deploy

If you want to use the app in real mode, enter the API key directly from the **Settings** interface.

## Project Goal

This MVP demonstrates an end-to-end document intelligence flow with a focus on:

- clear and immediate UX
- reliable structured output
- edge case handling
- a readable and professional result presentation
