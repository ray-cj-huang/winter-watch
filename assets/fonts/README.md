# Share-card fonts

Satori takes font buffers, not CSS, so the two faces the cards use are checked
in here rather than resolved through `next/font`. They are the same families
`src/app/layout.tsx` loads for the page.

| File | Family | Weight | Upstream |
| --- | --- | --- | --- |
| `Newsreader-SemiBold.ttf` | Newsreader | 600 | [Google Fonts](https://fonts.google.com/specimen/Newsreader) |
| `IBMPlexMono-Medium.ttf` | IBM Plex Mono | 500 | [Google Fonts](https://fonts.google.com/specimen/IBM+Plex+Mono) |

Both are licensed under the SIL Open Font License 1.1.

`ImageResponse` caps the whole rendered bundle — JSX, CSS and fonts — at 500 KB,
so keep replacements small and prefer `ttf` over `woff`.
