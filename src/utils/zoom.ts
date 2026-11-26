export const CHAVE_ZOOM = 'festival-zoom';

/** Níveis fixos de zoom (fração do tamanho padrão). */
export const NIVEIS_ZOOM = [0.9, 1.0, 1.1, 1.25, 1.5] as const;

export type ZoomNivel = (typeof NIVEIS_ZOOM)[number];

function nivelValido(valor: unknown): valor is ZoomNivel {
  return typeof valor === 'number' && (NIVEIS_ZOOM as readonly number[]).includes(valor);
}

/** Próximo nível na direção dada; retorna o próprio valor se já estiver na extremidade. */
export function zoomVizinho(atual: number, direcao: -1 | 1): number {
  const indice = NIVEIS_ZOOM.indexOf(atual as ZoomNivel);
  const base = indice === -1 ? NIVEIS_ZOOM.indexOf(1.0) : indice;
  const proximo = Math.min(Math.max(base + direcao, 0), NIVEIS_ZOOM.length - 1);
  return NIVEIS_ZOOM[proximo];
}

/** Aplica o zoom no documento (CSS zoom escala px e rem). */
export function aplicarZoom(nivel: number): void {
  document.documentElement.style.zoom = String(nivel);
}

export function lerZoomSalvo(): ZoomNivel {
  try {
    const bruto = localStorage.getItem(CHAVE_ZOOM);
    if (bruto === null) return 1.0;
    const valor = Number(bruto);
    return nivelValido(valor) ? valor : 1.0;
  } catch {
    return 1.0;
  }
}

export function salvarZoom(nivel: number): void {
  try {
    localStorage.setItem(CHAVE_ZOOM, String(nivel));
  } catch {
    /* localStorage indisponível — zoom fica só na sessão */
  }
}
