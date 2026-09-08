"use client";

import { useState } from "react";
import { useT } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/Button";

export type Coordinates = { latitude: number; longitude: number; accuracy?: number } | null;

type Status = "idle" | "loading" | "success" | "denied" | "unavailable";

export function LocationCapture({
  value,
  onChange,
}: {
  value: Coordinates;
  onChange: (coords: Coordinates) => void;
}) {
  const t = useT();
  const [status, setStatus] = useState<Status>(value ? "success" : "idle");

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setStatus("success");
      },
      (error) => {
        onChange(null);
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div>
      <span className="mb-2 block text-base font-semibold text-slate-800">
        {t.fieldLocation}
      </span>

      {status !== "success" && (
        <Button
          type="button"
          variant="secondary"
          onClick={requestLocation}
          disabled={status === "loading"}
        >
          {status === "loading" ? t.gettingLocation : t.useMyLocation}
        </Button>
      )}

      {status === "success" && value && (
        <div className="flex items-center justify-between rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3">
          <div>
            <p className="font-semibold text-emerald-800">{t.locationCaptured}</p>
            <p className="text-sm text-emerald-700">
              {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setStatus("idle");
            }}
            className="text-sm font-semibold text-emerald-800 underline"
          >
            {t.edit}
          </button>
        </div>
      )}

      {status === "denied" && (
        <p className="mt-2 text-sm text-amber-700">{t.locationDenied}</p>
      )}
      {status === "unavailable" && (
        <p className="mt-2 text-sm text-amber-700">{t.locationUnavailable}</p>
      )}
    </div>
  );
}
