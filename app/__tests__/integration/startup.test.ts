/**
 * Smoke test: startet "npm run normal" und prüft ob
 * (1) Metro hochfährt  und  (2) die App auf dem Emulator bootet.
 *
 * Voraussetzung: Ein Android-Emulator muss bereits laufen.
 * Ausführen mit:  npm run test:integration
 */

import { spawn, execSync, ChildProcess } from "child_process";

jest.setTimeout(300_000);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Wartet, bis eine der gesammelten Stdout-/Stderr-Zeilen auf `pattern` matcht.
// `abort` kann von außen vorzeitig rejected werden (z. B. Port-Konflikt).
function waitForLine(
  lines: string[],
  pattern: RegExp,
  timeoutMs: number,
  abort?: Promise<never>
): Promise<string> {
  return new Promise((resolve, reject) => {
    abort?.catch(reject);

    const deadline = setTimeout(() => {
      reject(new Error(`Timeout (${timeoutMs / 1000}s): Pattern ${pattern} nie gesehen.\nBisherige Ausgabe:\n${lines.slice(-40).join("\n")}`));
    }, timeoutMs);

    const interval = setInterval(() => {
      const match = lines.find((l) => pattern.test(l));
      if (match) {
        clearTimeout(deadline);
        clearInterval(interval);
        resolve(match);
      }
    }, 500);
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

  beforeAll(async () => {
    // Laufenden Prozess auf 8081 beenden bevor wir starten.
    // Fehler ignorieren — wenn der Port frei ist, ist das kein Problem.
    try {
      execSync("npx kill-port 8081", { stdio: "ignore" });
      await sleep(1_500); // kurz warten bis der Port wirklich frei ist
    } catch {
      // Port war nicht belegt
    }

    child = spawn("npm", ["run", "normal"], {
      shell: true,
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    const PORT_IN_USE = /Port \d+ is being used by another process/i;

    const collect = (chunk: Buffer | string) => {
      const text = chunk.toString();
      text.split(/\r?\n/).forEach((line) => {
        if (line.trim()) outputLines.push(line);
      });

      // Fallback: falls kill-port nicht gereicht hat, sofort abbrechen
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
    child.kill("SIGTERM");
    setTimeout(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    }, 5_000);
  });

  it("Phase 1: Metro-Bundler startet erfolgreich", async () => {
    const metroReady = /Metro waiting on|Starting Metro Bundler|metro.*started/i;
    const line = await waitForLine(outputLines, metroReady, 120_000, portConflict);
    expect(line).toMatch(metroReady);
  });

  it("Phase 1.5: Android-App öffnen ('a' drücken)", async () => {
    // Expo braucht nach dem Ready-Signal ein paar Sekunden bevor es
    // Tasteneingaben verarbeitet. Dann 'a' 3x mit Abstand senden.
    await sleep(4_000);
    for (let i = 0; i < 3; i++) {
      child.stdin?.write("a");
      await sleep(1_500);
    }
    // Kein assert nötig — wenn Expo nicht reagiert, schlägt Phase 2 fehl
  });

  it("Phase 2: App bootet auf Emulator (initdb e)", async () => {
    // console.log("initdb e") in app/_layout.tsx — erscheint sobald
    // die DB-Initialisierung abgeschlossen ist und die App rendert
    const appReady = /initdb e/;

    // Nach 60 s einmal neu laden falls der Emulator hängt
    const reloadTimer = setTimeout(() => {
      if (child.stdin?.writable) {
        console.log("Sende 'r' (Reload) an Expo...");
        child.stdin.write("r");
      }
    }, 60_000);

    try {
      const line = await waitForLine(outputLines, appReady, 240_000, portConflict);
      expect(line).toMatch(appReady);
    } finally {
      clearTimeout(reloadTimer);
    }
  });
});
