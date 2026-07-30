import { describe, expect, it } from 'vitest';
import {
  isMediaHeaderType,
  isValidHttpUrl,
} from './template-header-media';

describe('isMediaHeaderType', () => {
  it('accepts image/video/document', () => {
    expect(isMediaHeaderType('image')).toBe(true);
    expect(isMediaHeaderType('video')).toBe(true);
    expect(isMediaHeaderType('document')).toBe(true);
  });

  it('rejects text / empty / unknown', () => {
    expect(isMediaHeaderType('text')).toBe(false);
    expect(isMediaHeaderType(null)).toBe(false);
    expect(isMediaHeaderType(undefined)).toBe(false);
    expect(isMediaHeaderType('IMAGE')).toBe(false);
  });
});

describe('isValidHttpUrl', () => {
  it('accepts http(s) URLs', () => {
    expect(isValidHttpUrl('https://cdn.example.com/a.jpg')).toBe(true);
    expect(isValidHttpUrl('http://example.com/doc.pdf')).toBe(true);
  });

  it('rejects non-http schemes and garbage', () => {
    expect(isValidHttpUrl('ftp://x.com/a')).toBe(false);
    expect(isValidHttpUrl('not a url')).toBe(false);
    expect(isValidHttpUrl('')).toBe(false);
  });
});
