/**
 * Smoke test: startet "npm run normal" und prüft ob
 * (1) Metro hochfährt  und  (2) die App auf dem Emulator bootet.
 *
 * Voraussetzung: Ein Android-Emulator muss bereits laufen.
 * Ausführen mit:  npm run test:integration
 */

import { spawn, ChildProcess, execSync } from "child_process";
import { EventEmitter } from "events";

jest.setTimeout(300_000);

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

  it("Phase 1: Metro-Bundler startet erfolgreich", async () => {
    // Expo CLI gibt eine dieser Zeilen aus, sobald Metro bereit ist
    const metroReady = /Metro waiting on|Starting Metro Bundler|metro.*started/i;
    const line = await waitForLine(outputLines, metroReady, 120_000, portConflict);
    expect(line).toMatch(metroReady);

    console.log("🚀 Metro ist bereit. Starte Android-Deployment...");
    
    await new Promise((resolve) => setTimeout(resolve, 5000));
    for (let i = 0; i < 3; i++) {
      console.log(`Sende 'a' (${i + 1}/3)...`);
      child.stdin?.write("a");
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  });

  it("Phase 2: App bootet auf Emulator (initdb e)", async () => {
    // console.log("initdb e") in app/_layout.tsx:25 — erscheint sobald
    // die DB-Initialisierung abgeschlossen ist und die App rendert
    const appReady = /initdb e/;
    console.log("Warte auf App-Initialisierung (initdb e)...");
    
    const line = await waitForLine(outputLines, appReady, 240_000, portConflict);
    expect(line).toMatch(appReady);
    console.log("✅ App erfolgreich auf Emulator gestartet!");
  });
});
