# Demo sandbox

- URL: `https://clipboard-lan-bridge.sociobot.in/demo/` (local: `http://127.0.0.1:4173/demo/`).
- Entry: choose **Try it with sample data** on the first screen.
- Sample: a paired Studio laptop and Kitchen phone, one grocery-list arrival, and a realistic rail-booking handoff ready to send.
- Storage: website demo state uses only the `demo:clipboard-lan-bridge:tickets` key in `sessionStorage`. It never reads or writes the app's real namespace.
- Reset: choose **Reset demo** in the persistent banner. It restores the grocery arrival, prepared text, ten-minute selection, byte count, and validation state. **Download the desktop app** removes the demo key before taking you to the install step.
- Desktop sample: in the installed app choose **Load sample transfer**. It creates a Studio laptop / Kitchen phone sample only under `demo:clipboard-lan-bridge:desktop-sample` in the app webview session. **Reset sample** recreates it; **Start for real** discards it. The native app-data store is never read or written in sample mode.
