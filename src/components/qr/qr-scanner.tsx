"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faQrcode, faUpload, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { Html5Qrcode } from "html5-qrcode";
import { useToast } from "@/providers/toast-provider";

const readerId = "qr-scanner-reader";

function tableTokenFrom(value: string): string | null {
  const match = value.match(/\/qr\/([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

export function QrScanner() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (scanner.isScanning) await scanner.stop();
    } catch {
      scannerRef.current = null;
    }

    try {
      scanner.clear();
    } catch {
      scannerRef.current = null;
    }

    scannerRef.current = null;
  }, []);

  const handleResult = useCallback(
    (decodedText: string) => {
      const token = tableTokenFrom(decodedText);
      void stopScanner();

      if (!token) {
        setError("That QR code is not a table code.");
        return;
      }

      setOpen(false);
      router.push(`/qr/${token}`);
    },
    [router, stopScanner],
  );

  const startCamera = useCallback(async () => {
    setStarting(true);
    setError(null);

    try {
      const { Html5Qrcode: Scanner } = await import("html5-qrcode");
      if (!scannerRef.current) scannerRef.current = new Scanner(readerId, { verbose: false });
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        handleResult,
        () => undefined,
      );
    } catch {
      setError("Camera access is unavailable. Upload a QR image instead.");
    } finally {
      setStarting(false);
    }
  }, [handleResult]);

  const handleFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setError(null);
      await stopScanner();

      try {
        const { Html5Qrcode: Scanner } = await import("html5-qrcode");
        if (!scannerRef.current) scannerRef.current = new Scanner(readerId, { verbose: false });
        const decoded = await scannerRef.current.scanFile(file, true);
        handleResult(decoded);
      } catch {
        setError("We could not read a QR code from that image.");
        toast("We could not read a QR code from that image.", "error");
      } finally {
        event.target.value = "";
      }
    },
    [handleResult, stopScanner, toast],
  );

  useEffect(() => {
    if (!open) {
      void stopScanner();
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      void stopScanner();
    };
  }, [open, stopScanner]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-[10px] font-semibold text-ink-600 transition hover:bg-vanilla-100 hover:text-ink-900"
        aria-label="Scan a table QR code"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-strawberry-500 text-vanilla-0 shadow-soft">
          <FontAwesomeIcon icon={faQrcode} className="h-5 w-5" />
        </span>
        Scan QR
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink-900/60 p-4 sm:items-center" role="presentation" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-scanner-title"
            className="w-full max-w-lg rounded-[1.5rem] border border-border-warm bg-vanilla-0 p-5 shadow-lift"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="eyebrow">Table ordering</p>
                <h2 id="qr-scanner-title" className="mt-1 font-display text-xl">Scan the QR code on your table</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-600 hover:bg-vanilla-100"
                aria-label="Close scanner"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
            </div>

            {error ? (
              <p role="alert" className="mt-4 rounded-xl border border-danger/25 bg-strawberry-50 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            ) : null}

            <div id={readerId} className="mt-4 min-h-[240px] overflow-hidden rounded-xl border border-border-warm bg-ink-900/5" />

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void startCamera()}
                disabled={starting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-strawberry-500 px-4 text-sm font-semibold text-vanilla-0 transition hover:bg-strawberry-700 disabled:opacity-60"
              >
                <FontAwesomeIcon icon={faCamera} className="h-4 w-4" />
                {starting ? "Starting camera…" : "Use camera"}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border-warm px-4 text-sm font-semibold text-ink-700 transition hover:border-ink-900/20"
              >
                <FontAwesomeIcon icon={faUpload} className="h-4 w-4" />
                Upload image
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => void handleFile(event)} />
            </div>
            <p className="mt-3 text-center text-[11px] text-ink-600">
              Scanning opens your table session. It never places an order by itself.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
