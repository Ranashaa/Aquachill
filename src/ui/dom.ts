type Child = Node | string | number | null | undefined | false;
type Attrs = Record<string, unknown> & { class?: string; style?: string };

/** Mini helper de création DOM : h('div', { class: 'x', onclick }, enfants…). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs | null = null,
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2), v as EventListener);
      } else if (k === 'class') {
        el.className = String(v);
      } else if (k === 'html') {
        el.innerHTML = String(v);
      } else if (v === true) {
        el.setAttribute(k, '');
      } else {
        el.setAttribute(k, String(v));
      }
    }
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

/** Image pixel art agrandie proprement. `scale` = taille d'un pixel du sprite en px logiques. */
export function pxImg(src: string, width: number, height: number, scale = 1, extra: Attrs = {}): HTMLImageElement {
  return h('img', {
    class: 'px',
    src,
    alt: '',
    draggable: 'false',
    style: `width: calc(var(--px) * ${width * scale}); height: calc(var(--px) * ${height * scale});`,
    ...extra,
  });
}
