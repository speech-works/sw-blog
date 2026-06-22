export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Netlify functions transfer request body data between worker threads using
  // SharedArrayBuffer (zero-copy). @smithy/core's fromArrayBuffer does a strict
  // `instanceof ArrayBuffer` check and rejects SharedArrayBuffer, causing a
  // TypeError when signing S3/R2 upload requests.
  //
  // Patch ArrayBuffer's `instanceof` so SharedArrayBuffer also satisfies it. We
  // delegate to the ordinary hasInstance algorithm for BOTH constructors so the
  // behaviour is identical to native `instanceof` (correct null/undefined and
  // prototype-chain handling) — just also accepting SharedArrayBuffer. This is
  // safe: SharedArrayBuffer has the same binary layout and `new Uint8Array(sab)`
  // works in Node.js 22.
  if (typeof SharedArrayBuffer !== "undefined") {
    const ordinaryHasInstance = Function.prototype[Symbol.hasInstance];
    Object.defineProperty(ArrayBuffer, Symbol.hasInstance, {
      value(instance: unknown): boolean {
        return (
          ordinaryHasInstance.call(ArrayBuffer, instance) ||
          ordinaryHasInstance.call(SharedArrayBuffer, instance)
        );
      },
      configurable: true,
      writable: true,
    });
  }
}
