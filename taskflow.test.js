import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const html = readFileSync('./taskflow.html', 'utf8');
const { document } = new JSDOM(html).window;

test('feedback button exists in the header', () => {
  const btn = document.querySelector('header .feedback-btn');
  assert.ok(btn, 'feedback button should be present in the header');
});

test('feedback button is a mailto link', () => {
  const btn = document.querySelector('.feedback-btn');
  assert.ok(btn.getAttribute('href').startsWith('mailto:'), 'href should start with mailto:');
});

test('feedback button targets the correct email address', () => {
  const btn = document.querySelector('.feedback-btn');
  assert.ok(
    btn.getAttribute('href').includes('emmaloukarin@gmail.com'),
    'href should contain the feedback email address'
  );
});

test('feedback button has visible label text', () => {
  const btn = document.querySelector('.feedback-btn');
  assert.ok(btn.textContent.trim().length > 0, 'button should have non-empty text');
});
