"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AvailableNumberDto,
  Capability,
  Money,
  NumberType,
  RegionDto,
  StatusDto,
} from "@/lib/types";

const NUMBER_TYPES: { value: NumberType; label: string }[] = [
  { value: "LOCAL", label: "Local" },
  { value: "MOBILE", label: "Mobile" },
  { value: "TOLL_FREE", label: "Toll-free" },
];

function formatMoney(money?: Money): string {
  if (!money?.amount) return "—";
  return `${money.amount} ${money.currencyCode ?? ""}`.trim();
}

export function Storefront() {
  const [status, setStatus] = useState<StatusDto | null>(null);
  const [regions, setRegions] = useState<RegionDto[] | null>(null);
  const [regionCode, setRegionCode] = useState("US");
  const [numberType, setNumberType] = useState<NumberType>("LOCAL");
  const [capabilities, setCapabilities] = useState<Capability[]>(["SMS"]);
  const [pattern, setPattern] = useState("");

  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<AvailableNumberDto[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [rentTarget, setRentTarget] = useState<AvailableNumberDto | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then(setStatus)
      .catch(() => setStatus({ configured: false, missing: [] }));
  }, []);

  useEffect(() => {
    if (!status?.configured) return;
    fetch(`/api/regions?type=${numberType}`)
      .then(async (response) =>
        response.ok ? (await response.json()).regions : null,
      )
      .then(setRegions)
      .catch(() => setRegions(null));
  }, [status?.configured, numberType]);

  const toggleCapability = (capability: Capability) => {
    setCapabilities((current) =>
      current.includes(capability)
        ? current.filter((item) => item !== capability)
        : [...current, capability],
    );
  };

  const search = useCallback(async () => {
    setSearching(true);
    setSearched(true);
    setSearchError(null);
    setResults([]);
    try {
      const params = new URLSearchParams({
        regionCode,
        type: numberType,
      });
      if (capabilities.length > 0)
        params.set("capabilities", capabilities.join(","));
      if (pattern.trim()) params.set("pattern", pattern.trim());
      const response = await fetch(`/api/numbers/search?${params}`);
      const body = await response.json();
      if (!response.ok) {
        setSearchError(body.error ?? `Request failed (${response.status})`);
      } else {
        setResults(body.numbers ?? []);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  }, [regionCode, numberType, capabilities, pattern]);

  const configured = status?.configured ?? false;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sinch Numbers Storefront
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse virtual numbers available to rent via the Sinch Numbers API.
          </p>
        </div>
        {status &&
          (configured ? (
            <Badge>Live — Sinch API</Badge>
          ) : (
            <Badge variant="destructive">Credentials required</Badge>
          ))}
      </header>

      {status && !configured && (
        <Alert variant="destructive">
          <AlertTitle>Sinch credentials required</AlertTitle>
          <AlertDescription>
            <p>
              This storefront talks to the real Sinch Numbers API and found no
              credentials. Set{" "}
              <code className="font-mono">
                {status.missing.join(", ") ||
                  "SINCH_PROJECT_ID, SINCH_KEY_ID, SINCH_KEY_SECRET"}
              </code>{" "}
              (Sinch Dashboard → Settings → Access Keys) and restart the dev
              server. Searches below will show this same error — nothing is
              mocked.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Find available numbers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="region">Country</Label>
            {configured && regions ? (
              <Select value={regionCode} onValueChange={setRegionCode}>
                <SelectTrigger id="region" className="w-52">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem
                      key={region.regionCode}
                      value={region.regionCode}
                    >
                      {region.regionName} ({region.regionCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="region"
                className="w-52"
                value={regionCode}
                maxLength={2}
                placeholder="ISO code, e.g. US"
                onChange={(event) =>
                  setRegionCode(event.target.value.toUpperCase())
                }
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={numberType}
              onValueChange={(value) => setNumberType(value as NumberType)}
            >
              <SelectTrigger id="type" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NUMBER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Capabilities</Label>
            <div className="flex gap-2">
              {(["SMS", "VOICE"] as Capability[]).map((capability) => (
                <Button
                  key={capability}
                  type="button"
                  size="sm"
                  variant={
                    capabilities.includes(capability) ? "default" : "outline"
                  }
                  onClick={() => toggleCapability(capability)}
                >
                  {capability}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pattern">Digits (optional)</Label>
            <Input
              id="pattern"
              className="w-36"
              value={pattern}
              placeholder="e.g. 2020"
              onChange={(event) =>
                setPattern(event.target.value.replace(/\D/g, ""))
              }
            />
          </div>

          <Button onClick={search} disabled={searching || !regionCode}>
            {searching ? "Searching…" : "Search numbers"}
          </Button>
        </CardContent>
      </Card>

      {searching && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      )}

      {searchError && (
        <Alert variant="destructive">
          <AlertTitle>Search failed</AlertTitle>
          <AlertDescription>
            <p className="font-mono text-xs break-all">{searchError}</p>
          </AlertDescription>
        </Alert>
      )}

      {!searching && searched && !searchError && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No numbers matched these filters. Try another type or capability mix.
        </p>
      )}

      {results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((number) => (
            <Card key={number.phoneNumber}>
              <CardHeader>
                <CardTitle className="font-mono text-lg">
                  {number.phoneNumber}
                </CardTitle>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{number.type}</Badge>
                  {(number.capability ?? []).map((capability) => (
                    <Badge key={capability} variant="outline">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Monthly:</span>{" "}
                  {formatMoney(number.monthlyPrice)}
                  {number.paymentIntervalMonths &&
                  number.paymentIntervalMonths > 1
                    ? ` / ${number.paymentIntervalMonths} mo`
                    : ""}
                </p>
                <p>
                  <span className="text-muted-foreground">Setup:</span>{" "}
                  {formatMoney(number.setupPrice)}
                </p>
                {number.supportingDocumentationRequired && (
                  <p className="text-amber-600">Documentation required</p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setRentTarget(number)}
                >
                  Rent &amp; configure
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <RentDialog
        key={rentTarget?.phoneNumber ?? "closed"}
        number={rentTarget}
        onClose={() => setRentTarget(null)}
        configured={configured}
      />

      <footer className="text-xs text-muted-foreground">
        Powered by the official <code>@sinch/sdk-core</code> SDK —{" "}
        <code>availableRegions.list</code>, <code>availableNumber.list</code>{" "}
        and <code>availableNumber.rent</code>. Credentials never leave the
        server.
      </footer>
    </div>
  );
}

function RentDialog({
  number,
  onClose,
  configured,
}: {
  number: AvailableNumberDto | null;
  onClose: () => void;
  configured: boolean;
}) {
  const [smsServicePlanId, setSmsServicePlanId] = useState("");
  const [voiceAppId, setVoiceAppId] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [renting, setRenting] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const rent = async () => {
    if (!number?.phoneNumber) return;
    setRenting(true);
    setResult(null);
    try {
      const response = await fetch("/api/numbers/rent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: number.phoneNumber,
          smsServicePlanId,
          voiceAppId,
        }),
      });
      const body = await response.json();
      setResult(
        response.ok
          ? {
              ok: true,
              message: `Rented! Active number: ${JSON.stringify(
                body.activeNumber,
                null,
                2,
              )}`,
            }
          : { ok: false, message: body.error ?? `HTTP ${response.status}` },
      );
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setRenting(false);
    }
  };

  return (
    <Dialog open={number !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">{number?.phoneNumber}</DialogTitle>
          <DialogDescription>
            Rent this {number?.type?.toLowerCase().replace("_", "-")} number in{" "}
            {number?.regionCode} for {formatMoney(number?.monthlyPrice)}
            /month (setup {formatMoney(number?.setupPrice)}).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sms-plan">SMS service plan ID (optional)</Label>
            <Input
              id="sms-plan"
              value={smsServicePlanId}
              placeholder="Links the number to your SMS service"
              onChange={(event) => setSmsServicePlanId(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="voice-app">Voice app ID — RTC (optional)</Label>
            <Input
              id="voice-app"
              value={voiceAppId}
              placeholder="Links the number to your Voice app"
              onChange={(event) => setVoiceAppId(event.target.value)}
            />
          </div>

          <Alert>
            <AlertTitle>Renting bills your Sinch account</AlertTitle>
            <AlertDescription>
              <p>
                Confirming sends a real{" "}
                <code className="font-mono">:rent</code> request. Type{" "}
                <strong>RENT</strong> to enable the button.
              </p>
            </AlertDescription>
          </Alert>
          <Input
            aria-label="Type RENT to confirm"
            value={confirmText}
            placeholder="Type RENT to confirm"
            onChange={(event) => setConfirmText(event.target.value)}
          />

          {result && (
            <Alert variant={result.ok ? "default" : "destructive"}>
              <AlertTitle>{result.ok ? "Number rented" : "Rent failed"}</AlertTitle>
              <AlertDescription>
                <pre className="max-h-40 overflow-auto font-mono text-xs whitespace-pre-wrap break-all">
                  {result.message}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={confirmText !== "RENT" || renting || !configured}
            onClick={rent}
          >
            {renting
              ? "Renting…"
              : configured
                ? "Confirm rent"
                : "Credentials required"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
