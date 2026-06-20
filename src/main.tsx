import React from "react";
import { App } from "./App";
import { render } from "ink";

// Silence AI SDK warnings for a cleaner CLI experience
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).AI_SDK_LOG_WARNINGS = false;

render(<App />);
