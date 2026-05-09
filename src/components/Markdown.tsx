import React from "react";
import { Text } from "ink";
import { marked } from "marked";
import TerminalRenderer from "marked-terminal";

marked.setOptions({ renderer: new TerminalRenderer() });

export default function Markdown({ children }: { children: string }) {
  return <Text>{(marked.parse(children) as string).trim()}</Text>;
}
