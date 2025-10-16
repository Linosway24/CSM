export function svgDot(color = '#95a5a6') {
  return 'data:image/svg+xml;base64,' + btoa(
    `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
       <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
     </svg>`
  );
}
