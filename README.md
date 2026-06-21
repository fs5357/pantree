# Mise — kitchen on hand

Your pantry inventory, recipes, swap groups, and shopping list in one small app.
Pre-loaded with your kitchen. Everything saves in your browser (`localStorage`).

## Run it

You need [Node.js](https://nodejs.org) (version 18 or newer). Then, from this folder:

```bash
npm install      # one time — downloads dependencies
npm run dev      # starts the app, prints a http://localhost:5173 link
```

Open the link it prints. Edit, stock, cook — it all saves automatically.

## Put it online (optional)

```bash
npm run build    # creates a "dist" folder of static files
```

Drag the `dist` folder onto [netlify.com/drop](https://app.netlify.com/drop) for a free
public URL, or use Vercel / GitHub Pages. Then you can open it from your phone too.

## Use it on your phone too (sync across devices)

By default Mise saves only in the browser you're using, so devices don't share
data. To sync your phone and computer through a free cloud database, follow
**SYNC-SETUP.md** in this folder.

## Good to know

- **Data lives in the browser it was used in.** Your laptop and phone keep separate
  copies — they don't sync. Clearing browser data wipes it.
- **Back up / move data:** open the browser console (F12) on the app and run
  `copy(localStorage.getItem("mise:data:v1"))` to copy it, then
  `localStorage.setItem("mise:data:v1", `paste here`)` in another browser to restore.
- The **Reset to sample kitchen** link at the bottom restores the starting data.

## Project layout

```
mise/
├─ index.html          page shell
├─ package.json        dependencies + scripts
├─ vite.config.js      build config
└─ src/
   ├─ main.jsx         boots React
   ├─ App.jsx          the whole app
   └─ index.css        background + reset (styles are inside App.jsx)
```
