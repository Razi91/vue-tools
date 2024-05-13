---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Vue Tools"
  text: "Vue high-level utilities done right"
  tagline: mitt-like event bus, but for Vue
  actions:
    - theme: brand
      text: Event Bus
      link: /event-bus/
    - theme: alt
      text: Form tool
      link: /form-tools/

features:
  - title: TypeScript by default
    details: Keep your types safe with TypeScript by default
  - title: Latest Vue 3 first (and only)
    details: Designed specifically for latest Vue versions
  - title: Devtools
    details: Debug your app in Vue's devtools
---

# About project
This is not designed to be a wrapper for any other library. 

Base rule for this: **no dependencies**. Okay, maybe vue-use, because that one probably everyone will use. 

Inspired by vue-use, but tools here are much more high-level, optionally have devtools.

## Installation
(TODO) Not yet deployed to npm

## Features
Zero dependency, just import what you need, ignore everything else.

### Event bus
 * Highly inspired by mitt
 * TypeScript first
 * Local (provide/inject), and global
 * BroadcastChannel - sent events to other app instances on client's browser
 * Some other tweaks for Vue developers
 * Devtools timeline!

### Form tools
 * Custom setters for fields
 * Track changes in your form
 * Queued async setters
 * Chaining setters with conflict detection
 * Undo! (TODO maybe)
 * Validation (TODO maybe)

