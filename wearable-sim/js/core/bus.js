// ====== CORE: EVENT BUS ======
const Bus={h:{},on(e,f){(this.h[e]=this.h[e]||[]).push(f);return this},emit(e,d){(this.h[e]||[]).concat(this.h["*"]||[]).forEach(f=>f(d,e))}};
