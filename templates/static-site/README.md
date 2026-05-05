# static-site

Plain HTML/CSS/JS, no build step.

## Run

Any static file server works. A few options:

```sh
python3 -m http.server 8000
# or
npx --yes serve .
```

Then open http://localhost:8000.

## Layout

- `index.html` — page markup
- `styles.css` — styles
- `main.js` — ES module loaded by `index.html`
