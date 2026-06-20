import React from "react";
import { Text } from "ink";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";

marked.setOptions({
  renderer: new TerminalRenderer() as never,
});

export function getMarkdownAnsi(text: string) {
  if (!text) return "";
  const ansi = marked.parse(text) as string;
  // marked-terminal usually adds a single trailing newline.
  // We remove it to allow inline rendering or manual newline control.
  return ansi.replace(/\n$/, "");
}

export default function Markdown({ children }: { children: string }) {
  return <Text>{getMarkdownAnsi(children)}</Text>;
}
