# Vite React Typescript Starter

This project is a Vite-powered React + TypeScript application with multi-environment support.

## Getting Started

### Install dependencies

```bash
npm install
```

### Environment Configuration

This project supports three environments:

- **Local Development:** `.env.local`
- **QA Environment:** `.env.qa`
- **Production:** `.env.production`

Each file should define the API URL:

```
VITE_API_URL=your_api_url_here
```

### Running the App

- **Local Development:**
  ```bash
  npm run dev
  ```
  Uses `.env.local`.

- **QA Environment:**
  ```bash
  npm run dev:qa
  ```
  Uses `.env.qa`.

- **Production Environment (locally):**
  ```bash
  npm run dev:prod
  ```
  Uses `.env.production`.

### Building the App

- **Production Build:**
  ```bash
  npm run build
  ```
  Uses `.env.production`.

- **QA Build:**
  ```bash
  npm run build:qa
  ```
  Uses `.env.qa`.

### Preview Production Build

After building, preview the production build locally:

```bash
npm run preview
```

---

## Project Structure

- `src/` — Main source code
- `src/components/` — React components
- `.env.*` — Environment variable files

## Notes
- Environment variables must be prefixed with `VITE_` to be exposed to the client.
- Update the API URLs in the `.env.*` files as needed for each environment.

---

## License

MIT
