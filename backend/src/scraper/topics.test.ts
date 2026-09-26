import assert from 'node:assert/strict';
import { classify } from './topics';
import { isPermissiveLicense } from '../storage/license';

const cases: Array<[string, string | undefined, string]> = [
  ['Alignment of superintelligence: an AI safety primer', undefined, 'survie'],
  ['Your LLM Pipeline Never Throws: Three Guardrails for Silent AI Failure', undefined, 'ia'], // "guardrails" seul != securite de l'IA
  ['Multiples vulnérabilités dans le noyau Linux', undefined, 'cybersec'],
  ['Show HN: my new LLM agent framework', undefined, 'ia'],
  ['Tailwind v5 flexbox tricks', undefined, 'css'],
  ['Why I left React for Svelte', undefined, 'js'],
  ['Django 6 released', undefined, 'python'],
  ['Kubernetes on a Raspberry Pi', undefined, 'devops'],
  ['My cat is a good boy', undefined, 'general'],
  ['My cat is a good boy', 'devops', 'devops'],
  ['Bad hint is ignored', 'nope', 'general'],
];
for (const [text, hint, want] of cases) assert.equal(classify(text, hint), want, `classify(${text})`);

const lic: Array<[string | undefined, boolean]> = [
  ['Attribution', true],
  ['Attribution - Share Alike', true],
  ['CC BY 4.0', true],
  ['CC BY-SA 4.0', true],
  ['Public Domain Dedication', true],
  ['CC0', true],
  ['Attribution - Non Commercial - Share Alike', false],
  ['Attribution - Non Commercial - No Derivatives', false],
  ['CC BY-NC-ND 4.0', false],
  ['CC BY-NC 4.0', false],
  ['Unknown', false],
  [undefined, false],
  ['', false],
];
for (const [label, want] of lic) assert.equal(isPermissiveLicense(label), want, `license(${label})`);

console.log(`topics + licences: ${cases.length + lic.length} assertions OK`);
