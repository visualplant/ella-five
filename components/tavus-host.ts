"use client";

import type { TavusIntegration } from "@tavus/widget";

type ReadyListener = (ready: boolean) => void;
type LoadListener = () => void;

const listeners = new Set<ReadyListener>();
const loadListeners = new Set<LoadListener>();
let ready = false;
let integration: TavusIntegration | null = null;
let pendingStart = false;

export function subscribeTavusReady(listener: ReadyListener) {
  listeners.add(listener);
  listener(ready);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeTavusLoadRequest(listener: LoadListener) {
  loadListeners.add(listener);
  return () => {
    loadListeners.delete(listener);
  };
}

export function requestTavusLoad() {
  for (const listener of loadListeners) listener();
}

export function setTavusReady(value: boolean) {
  if (ready === value) return;
  ready = value;
  for (const listener of listeners) listener(ready);
  if (ready) maybeStart();
}

export function setTavusIntegration(next: TavusIntegration | null) {
  integration = next;
  if (!next) setTavusReady(false);
  else maybeStart();
}

function maybeStart() {
  if (!pendingStart || !integration || !ready) return;
  pendingStart = false;
  startNow();
}

function startNow() {
  if (!integration) return;
  // Skip the device-check screen only for this host button start: the visitor
  // has already clicked "Talk to Ella", so a second Start click is extra.
  // updateConfig deep-merges and stays in effect for this element instance;
  // the floating launcher still uses the portal haircheck until this is called.
  integration.updateConfig({ customization: { show_haircheck: false } });
  integration.startConversation();
}

export function startTalkToElla() {
  if (integration && ready) {
    startNow();
    return;
  }
  pendingStart = true;
  requestTavusLoad();
}
