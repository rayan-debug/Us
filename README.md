# Museum of Us ❤

A small private 3D game that runs in the browser. You play a blocky girl and walk around a
museum whose walls are covered with our photos and love quotes. The password is our date.

## Controls
| | Computer | Phone |
|---|---|---|
| Walk | W A S D or arrow keys (Shift to run) | joystick on the left side |
| Look | drag the mouse, scroll to zoom | drag on the right side |
| Jump | Space | jump button |
| 1st / 3rd person | V (or scroll all the way in) | 1st/3rd button |
| Hug / kiss | H / K or the 🤗 💋 buttons | 🤗 💋 buttons |
| See a photo in full resolution | E or click the photo | tap the photo or the prompt |

## Adding the photos
1. Put the pictures (jpg, png, webp or heic) in the `photos/` folder.
2. Run `python3 tools/build_photos.py` (needs `pip install pillow`, plus `pillow-heif` for iPhone HEIC files).
   It makes small and sharp copies in `generated/` and writes `generated/photos.json`.
   The GitHub Pages workflow also runs this script on every deploy, so you can upload photos
   through the GitHub website and they will show up.
3. Optional: `photos/captions.json` (`{"IMG_1234.jpg": "Our first date"}`) puts your own words on
   the brass plaque under a photo, and `photos/order.txt` (one file name per line) sets the order.
   Without it, photos are sorted by the date they were taken.

Without photos the museum shows "coming soon" frames.

## Personalising
Edit `js/content.js` to change the name above the character, the quotes, the final message,
or to add a song (`music: 'music/our-song.mp3'`).

## Publishing on GitHub Pages
Repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The workflow in `.github/workflows/pages.yml` then publishes the site on every push.
On the free plan, GitHub Pages needs the repository to be public.

## Privacy
The password only hides the game. The site is static, so anyone who has the direct link
to an image file, or who browses the repository, can still see the photos.

## Characters
At the start you pick **Meme** (her) or **Rore** (him). The other character follows you everywhere,
and Rore, holding his rose, is the one who talks in the speech bubbles. Use the ⇄ button at the top
to switch characters during the game. Change the names and his lines in `js/content.js`.
