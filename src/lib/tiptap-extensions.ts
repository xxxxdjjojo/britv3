// src/lib/tiptap-extensions.ts
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

export const TIPTAP_EXTENSIONS = [StarterKit, Image, Link];
// NEVER import TipTap extensions in two places — always import from here
