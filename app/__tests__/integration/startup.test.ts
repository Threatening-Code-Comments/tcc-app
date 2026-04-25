/**
 * Smoke test: startet "npm run normal" und prüft ob
 * (1) Metro hochfährt  und  (2) die App auf dem Emulator bootet.
 *
 * Voraussetzung: Ein Android-Emulator muss bereits laufen.
 * Ausführen mit:  npm run test:integration
 */

import { spawn, ChildProcess, execSync } from "child_process";

jest.setTimeout(300_000);

// Wartet, bis eine der gesammelten Stdout-/Stderr-Zeilen auf `pattern` matcht.
// `lines` wird von außen befüllt, damit beide Ströme in denselben Buffer fließen.
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

  beforeAll(() => {
    // Sicherstellen, dass der Metro-Port (8081) nicht belegt ist
    try {
      console.log("Bereinige Port 8081...");
      execSync("npx kill-port 8081", { stdio: "ignore" });
    } catch (e) { /* Ignorieren, falls Port bereits frei */ }

    child = spawn("npm", ["run", "normal"], {
      shell: true,
      // Expo braucht ein Terminal-ähnliches Env; ohne pty bekommen wir trotzdem Logs
      env: { ...process.env, FORCE_COLOR: "0" },
    });

    const PORT_IN_USE = /Port \d+ is being used by another process/i;

    const collect = (chunk: Buffer | string) => {
      const text = chunk.toString();
      // Jede Zeile einzeln speichern, damit Pattern-Matching zuverlässig ist
      text.split(/\r?\n/).forEach((line) => {
        if (line.trim()) {
          outputLines.push(line);
        }
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

  it("Phase 1: Metro-Bundler startet erfolgreich", async () => {
    // Expo CLI gibt eine dieser Zeilen aus, sobald Metro bereit ist
    const metroReady = /Metro waiting on|Starting Metro Bundler|metro.*started/i;
    const line = await waitForLine(outputLines, metroReady, 120_000, portConflict);
    expect(line).toMatch(metroReady);

    // Metro ist bereit -> kurz warten und 'a' drücken, um Android-Start zu erzwingen
    await new Promise((resolve) => setTimeout(resolve, 5000));
    for (let i = 0; i < 3; i++) {
      child.stdin?.write("a");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });

  it("Phase 2: App bootet auf Emulator (initdb e)", async () => {
    // console.log("initdb e") in app/_layout.tsx:25 — erscheint sobald
    // die DB-Initialisierung abgeschlossen ist und die App rendert
    const appReady = /initdb e/;
    const line = await waitForLine(outputLines, appReady, 240_000, portConflict);
    expect(line).toMatch(appReady);
  });
});
