/**
 * Smoke test: startet "npm run normal" und prüft ob
 * (1) Metro hochfährt  und  (2) die App auf dem Emulator bootet.
 *
 * Voraussetzung: Ein Android-Emulator muss bereits laufen.
 * Ausführen mit:  npm run test:integration
 */

import { spawn, ChildProcess, execSync } from "child_process";
import { EventEmitter } from "events";

jest.setTimeout(45_000);

const lineEmitter = new EventEmitter();

/**
 * Wartet auf ein bestimmtes Pattern in den Logs via Events.
 */
function waitForLine(
  lines: string[],
  pattern: RegExp,
  timeoutMs: number,
  abort?: Promise<never>
): Promise<string> {
  return new Promise((resolve, reject) => {
    let finished = false;
    console.log(lines.at(lines.length-1))

    const cleanup = () => {
      finished = true;
      lineEmitter.removeListener("line", checkLine);
    };

    const checkLine = (line: string) => {
      if (finished) return;
      if (pattern.test(line)) {
        cleanup();
        clearTimeout(deadline);
        resolve(line);
      }
    };

    abort?.catch((err) => {
      cleanup();
      reject(err);
    });

    const deadline = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout (${timeoutMs / 1000}s): Pattern ${pattern} nie gesehen.\nBisherige Ausgabe:\n${lines.slice(-40).join("\n")}`));
    }, timeoutMs);

    lineEmitter.on("line", checkLine);
    
    // Sofort-Check für bereits existierende Zeilen
    for (const l of lines) {
      if (pattern.test(l)) {
        cleanup();
        clearTimeout(deadline);
        resolve(l);
        break;
      }
    }
  });
}

describe("App-Startup Smoketest", () => {
  let child: ChildProcess;
  const outputLines: string[] = [];

  // Wird rejected sobald Expo einen Port-Konflikt meldet und "n" gesendet wurde.
  let rejectPortConflict!: (err: Error) => void;
  const portConflict: Promise<never> = new Promise((_, reject) => {
    rejectPortConflict = reject;
  });

  beforeAll(() => {
    // Port 8081 freiräumen — listening PID via PowerShell killen (sprachunabhängig,
    // netstat-Output ist auf DE-Windows "ABHÖREN" statt "LISTENING").
    try {
      console.log("Bereinige Port 8081...");
      execSync(
        'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"',
        { stdio: "ignore" }
      );
    } catch (e) { /* Port bereits frei */ }

    // Alle Drittparteien-Apps auf dem Emulator force-stoppen, damit nichts
    // (z. B. eine alte Expo-Go-Instanz, ein alter Dev-Build) im Hintergrund
    // den Test stört.
    try {
      const pkgs = execSync("adb -s emulator-5554 shell pm list packages -3", { encoding: "utf8" })
        .split(/\r?\n/)
        .map(l => l.replace(/^package:/, "").trim())
        .filter(Boolean);
      for (const pkg of pkgs) {
        console.log(`force-stop ${pkg}`);
        execSync(`adb -s emulator-5554 shell am force-stop ${pkg}`, { stdio: "ignore" });
      }
    } catch (e) { /* kein Emulator? wird in Phase 1/2 sichtbar */ }

    // npm run normal nutzt --clear, was den Bundler-Cache jedes Mal löscht (~30s+).
    // Für den Smoketest lassen wir das weg, damit warme Caches genutzt werden.
    child = spawn("npx", ["cross-env", "APP_VARIANT=development", "expo", "start", "--go", "--android"], {
      shell: true,
      // Expo braucht ein Terminal-ähnliches Env; ohne pty bekommen wir trotzdem Logs.
      // NODE_ENV explizit setzen: Jest setzt NODE_ENV=test, das wird sonst an Expo vererbt
      // und babel-preset-expo's expo-router-plugin skipped die EXPO_ROUTER_APP_ROOT-Ersetzung
      // (→ require.context(undefined,...) → 500 beim Bundle).
      env: { ...process.env, FORCE_COLOR: "0", NODE_ENV: "development" },
    });

    const PORT_IN_USE = /Port \d+ is being used by another process/i;
    const GENERIC_ERROR = /Error: |Exception |No Android devices or emulators found/i;

    const collect = (chunk: Buffer | string) => {
      const text = chunk.toString();
      text.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        outputLines.push(trimmed);
        lineEmitter.emit("line", trimmed);
      });

      // Port-Konflikt: "n" senden damit Expo nicht auf einem anderen Port weitermacht,
      // und alle laufenden waitForLine-Promises sofort abbrechen.
      if (PORT_IN_USE.test(text)) {
        child.stdin?.write("n\n");
        rejectPortConflict(
          new Error(
            `Port-Konflikt erkannt — Expo hat gefragt ob es einen anderen Port nutzen soll.\n` +
            `Bitte den laufenden Metro-Prozess beenden (z. B. "npx kill-port 8081") und den Test erneut starten.\n` +
            `Expo-Ausgabe: ${text.trim()}`
          )
        );
      }

      // Fail-Fast bei anderen Fehlern
      if (GENERIC_ERROR.test(text) && !text.includes("initdb")) {
        console.warn("⚠️ Möglicher Fehler im Log erkannt:", text.trim());
      }
    };

    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);
  });

  afterAll((done) => {
    if (!child || child.exitCode !== null) {
      done();
      return;
    }
    child.once("exit", () => done());
    // Erst sanft beenden, nach 5 s hart killen
    child.kill("SIGTERM");
    setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }, 5_000);
  });

  it("Phase 1: Metro-Bundler startet (20s)", async () => {
    const metroReady = /Metro waiting on|Starting Metro Bundler|metro.*started/i;
    const line = await waitForLine(outputLines, metroReady, 20_000, portConflict);
    expect(line).toMatch(metroReady);
    console.log("🚀 Metro ist bereit.");
  });

  it("Phase 2: Expo zielt Emulator an (10s)", async () => {
    // "› Opening exp://127.0.0.1:8081 on Pixel_8_Pro_API_36"
    const targeting = /Opening .* on Pixel/i;
    const line = await waitForLine(outputLines, targeting, 10_000, portConflict);
    expect(line).toMatch(targeting);
    console.log("📱 Emulator wurde angesteuert.");
  });

  it("Phase 3: App-JS lädt — initdb startet (30s)", async () => {
    // console.log("initdb s") in app/_layout.tsx:23 — erste Zeile aus dem on-device JS
    // bedeutet: Bundle ist gebaut, ans Gerät übertragen, Hermes hat ihn ausgeführt.
    const jsStart = /initdb s/;
    const line = await waitForLine(outputLines, jsStart, 30_000, portConflict);
    expect(line).toMatch(jsStart);
    console.log("⚙️  JS läuft, DB-Init gestartet.");
  });

  it("Phase 4: App fertig initialisiert (15s)", async () => {
    // console.log("initdb e") in app/_layout.tsx:25
    const appReady = /initdb e/;
    const line = await waitForLine(outputLines, appReady, 15_000, portConflict);
    expect(line).toMatch(appReady);
    console.log("✅ App erfolgreich auf Emulator gestartet!");
  });
});
