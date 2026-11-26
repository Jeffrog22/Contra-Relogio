// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CHAVE_ZOOM,
  NIVEIS_ZOOM,
  aplicarZoom,
  lerZoomSalvo,
  salvarZoom,
  zoomVizinho,
} from './zoom';

describe('zoom — níveis', () => {
  it('tem os níveis na ordem crescente', () => {
    expect(NIVEIS_ZOOM).toEqual([0.9, 1.0, 1.1, 1.25, 1.5]);
    for (let i = 1; i < NIVEIS_ZOOM.length; i++) {
      expect(NIVEIS_ZOOM[i]).toBeGreaterThan(NIVEIS_ZOOM[i - 1]);
    }
  });
});

describe('zoom — zoomVizinho', () => {
  it('aumenta e diminui um passo', () => {
    expect(zoomVizinho(1.0, 1)).toBe(1.1);
    expect(zoomVizinho(1.0, -1)).toBe(0.9);
    expect(zoomVizinho(1.25, 1)).toBe(1.5);
    expect(zoomVizinho(1.1, -1)).toBe(1.0);
  });

  it('fica na extremidade (clamp)', () => {
    expect(zoomVizinho(1.5, 1)).toBe(1.5);
    expect(zoomVizinho(0.9, -1)).toBe(0.9);
  });

  it('valor fora da lista cai no padrão 1.0', () => {
    expect(zoomVizinho(0.77, 1)).toBe(1.1);
    expect(zoomVizinho(0.77, -1)).toBe(0.9);
  });
});

describe('zoom — persistência e aplicação', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.zoom = '';
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.style.zoom = '';
  });

  it('lerZoomSalvo retorna 1.0 sem chave salva', () => {
    expect(lerZoomSalvo()).toBe(1.0);
  });

  it('salvarZoom persiste e lerZoomSalvo recupera', () => {
    salvarZoom(1.25);
    expect(localStorage.getItem(CHAVE_ZOOM)).toBe('1.25');
    expect(lerZoomSalvo()).toBe(1.25);
  });

  it('lerZoomSalvo ignora valor inválido salvo', () => {
    localStorage.setItem(CHAVE_ZOOM, '99');
    expect(lerZoomSalvo()).toBe(1.0);
    localStorage.setItem(CHAVE_ZOOM, 'abc');
    expect(lerZoomSalvo()).toBe(1.0);
  });

  it('aplicarZoom define zoom no documento', () => {
    aplicarZoom(1.1);
    expect(document.documentElement.style.zoom).toBe('1.1');
  });
});
