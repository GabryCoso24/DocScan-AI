# DocScan AI

DocScan AI is a document intelligence MVP for analyzing images and PDFs of receipts, invoices, contracts, and identity documents, and extracting the data into structured JSON with AI.

The project was built as an application for Mamazen and is designed to demonstrate a complete flow: document upload, extraction through a selectable model, structured result visualization, and session history.

## Features

- Drag & drop upload or file picker support
- Image support for `JPG`, `PNG`, `WebP`, and `HEIC`
- PDF support with first-page rendering in the browser
- Demo mode with no API key required and realistic simulated results
- Data extraction through OpenRouter using server-side environment variables
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
- PDF rendering via `pdfjs-dist`
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

If `OPENROUTER_API_KEY` is not set, the app automatically switches to demo mode and generates a realistic simulated result. This is useful for presenting the product or trying the flow without credentials.

### Real Mode with OpenRouter

1. Create a `.env.local` file in the project root
2. Add your OpenRouter key as `OPENROUTER_API_KEY`
3. Optionally set `OPENROUTER_MODEL` to override the default server model
4. Restart the dev server or redeploy the app
5. Upload an image or PDF from **Analyze Document**

Example:

```env
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=google/gemini-3-flash-preview
```

## How It Works

1. The user uploads a document image
2. If the file is a PDF, the first page is rendered to an image in the browser
3. The client converts the image to base64 and sends it to `POST /api/extract`
4. The server reads `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` from the environment
5. If the key is missing, the route returns a demo payload instead of calling the provider
6. The server calls OpenRouter with a strict output schema when real mode is enabled
7. The JSON response is parsed and displayed in the UI
8. The result is stored in the session history

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

- accepts `imageBase64`, `mimeType`, `sourceFileName`, and `sourceMimeType`
- sends the prompt to OpenRouter when `OPENROUTER_API_KEY` is configured
- falls back to demo data when the API key is missing
- enforces valid JSON output
- handles authentication, rate limit, and parsing errors

The PDF flow also improves classification hints by forwarding the original file name and MIME type to the route.

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
- Real credentials live in `.env.local` and are not exposed to the browser.
- History is local to the browser session and is not persisted to a database.
- In case of rate limiting, the client waits and retries automatically.
- The extraction flow is designed to avoid invented values: fields that are not visible are returned as `null`.
- In demo mode, PDF documents are treated as invoices for more consistent presentation.

## Deployment

The project is ready to be deployed on Vercel with minimal configuration.

1. Push the repository to GitHub
2. Connect the repository to Vercel
3. Add `OPENROUTER_API_KEY` and optionally `OPENROUTER_MODEL` in the Vercel environment variables
4. Deploy

There is no API key form in the UI anymore. Configure the environment variables and redeploy.

## Project Goal

This MVP demonstrates an end-to-end document intelligence flow with a focus on:

- clear and immediate UX
- reliable structured output
- edge case handling
- a readable and professional result presentation
