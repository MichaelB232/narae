# Simulasi Device Wearable (Jadwal + Bantuan)

Simulasi 3D hardware di browser. Tanpa build step: buka `index.html`, atau jalankan `npx serve .`.

## Struktur

```
wearable-sim/
├─ index.html               urutan <script> = urutan dependensi
├─ css/style.css
├─ db/schema.sql            tabel events dan help_requests (Supabase/Postgres)
└─ js/
   ├─ config.js             CONFIG: jadwal, durasi Help Mode, bindings, storage
   ├─ core/
   │  ├─ bus.js             event bus (Bus.on / Bus.emit)
   │  ├─ store.js           Store + adapter memory, local, http
   │  └─ adapters/supabase.js
   ├─ hardware/
   │  ├─ scene.js           renderer, kamera, cahaya, helper, registry part()
   │  ├─ parts/             satu file = satu komponen 3D
   │  ├─ buttons.js         komponen yang punya animasi tekan
   │  └─ hw.js              audio, suara, status LED dan mikrofon
   ├─ ui/popup.js           show() / hide()
   ├─ features/
   │  ├─ help-mode.js       state machine Help Mode
   │  └─ actions.js         kumpulan aksi
   └─ app/
      ├─ wiring.js          komponen -> event -> action, log, subscriber database
      ├─ interaction.js     pointer, hover, klik
      ├─ panel.js           panel samping, preset kamera
      └─ loop.js            resize dan render loop
```

## Menambah aksi baru

1. Tulis fungsi di `js/features/actions.js` (menerima `ctx`: Bus, Store, CONFIG, UI, Hw):

```js
Actions.sendLocation = ctx => {
  ctx.Hw.beep(700);
  ctx.Store.save("locations", { lat: -7.56, lng: 110.82 });
  ctx.UI.show("blue", "<h3>Lokasi terkirim</h3>", [["Tutup", ctx.UI.hide]]);
};
```

2. Ikat ke komponen di `js/config.js`: `bindings: { speaker: "sendLocation" }`.
3. Reaksi tambahan tanpa mengubah aksi: `Bus.on("help", s => { /* kirim ke server, MQTT, dll */ })`.

## Menambah komponen 3D

Salin salah satu file di `js/hardware/parts/`, daftarkan dengan `part(key, nama, group, vektorExplode, posisi)`, lalu tambahkan `<script>` di `index.html`. Beri `key` itu satu aksi di `CONFIG.bindings` agar bisa diklik.

## Database

Ganti `CONFIG.storage.adapter`: `local` (default, per browser), `memory`, `http` (REST ke backend sendiri), atau `supabase`. Untuk Supabase: jalankan `db/schema.sql`, isi `url` dan `key` di config. Semua event masuk ke tabel `events`, permintaan bantuan ke `help_requests`.

## Catatan

- three.js (r128) dimuat dari CDN. Untuk offline: `npm i three@0.128.0` lalu arahkan tag script ke `node_modules`.
- Langkah berikutnya: migrasi ke Vite + React Three Fiber. Tiap file di `parts/` menjadi satu komponen, `Bus`/`Store`/`Actions` bisa dipakai apa adanya.
