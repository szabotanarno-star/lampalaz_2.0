# Lámpaláz – MI az első tanévben

Kalandjáték kezdő pedagógusoknak, csoportos szavazással. A résztvevők egy négykarakteres kóddal csatlakoznak, regisztráció nélkül. Minden helyzetben az a lépés valósul meg, amelyik több szavazatot kap; döntetlennél az előadó dönt. Egyéni játékként is játszható.

Készítette: Szabó Márta, 2026.

## Felépítés

| Fájl | Szerep |
|---|---|
| `index.html` | A teljes játék (szövegek, megjelenés, böngészőoldali logika) |
| `api/state.js` | A játék állapotának lekérdezése (a résztvevők és az előadó 2 másodpercenként hívja) |
| `api/vote.js` | Szavazat leadása |
| `api/host.js` | Előadói műveletek: játék létrehozása, indítás, szavazás lezárása, továbblépés |
| `lib/game.js` | A szavazás szabályai |
| `lib/store.js` | Adattárolás (Upstash Redis; helyben memória) |
| `dev-server.mjs` | Helyi kipróbáláshoz |

A játék szövegeit és forrásait az `index.html` `SCENES` és `SOURCES` tömbje tartalmazza.

## Telepítés Vercelre

1. **GitHub:** hozzon létre egy új repót (pl. `lampalaz`, lehet privát is), és töltse fel a mappa teljes tartalmát (az `api` és a `lib` mappát is).
2. **Vercel:** *Add New → Project*, válassza ki a repót. A *Framework Preset* legyen **Other**. *Deploy*.
3. **Adatbázis:** a projektben *Storage* → *Upstash for Redis* (Marketplace) → *Create* → kapcsolja a projekthez. Ez automatikusan beállítja a kapcsolódási változókat (`KV_REST_API_URL`, `KV_REST_API_TOKEN` vagy `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`; a kód mindkettőt elfogadja).
4. **Előadói jelszó:** *Settings → Environment Variables* → új változó: `ELOADO_JELSZO` = egy Ön által választott jelszó.
5. **Újratelepítés:** *Deployments* → a legutóbbi telepítés menüjében *Redeploy*. A változók csak új telepítésnél lépnek életbe.

## Használat

- **Előadó:** a kezdőlapon *Előadóknak* → jelszó → *Csoportos játék indítása*. Megjelenik a kód és az oldal címe; ezt vetítse ki.
- **Résztvevők:** megnyitják a címet, beírják a kódot. Szavazni a lezárásig lehet, és a szavazat módosítható.
- Egy játék 12 óráig él az adatbázisban, utána magától törlődik.
- Ugyanarról a böngészőről egy szavazat számít; aki másik böngészőt vagy privát ablakot nyit, az új szavazóként jelenik meg. Továbbképzésen ez elfogadható, éles választásra nem alkalmas.

## Helyi kipróbálás

```
npm install
npm run dev
```

Majd: http://localhost:3000 – az előadói jelszó helyben: `proba`. Adatbázis nélkül memóriában tárol.
