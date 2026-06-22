export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Netlify functions transfer request body data between worker threads using
  // SharedArrayBuffer (zero-copy). @smithy/core's fromArrayBuffer does a strict
  // `instanceof ArrayBuffer` check and rejects SharedArrayBuffer, causing a
  // TypeError when signing S3/R2 upload requests.
  //
  // Patching Symbol.hasInstance makes SharedArrayBuffer satisfy that check.
  // It is safe: SharedArrayBuffer has the same binary layout as ArrayBuffer, and
  // `new Uint8Array(sharedArrayBuffer)` works correctly in Node.js 22.
  if (typeof SharedArrayBuffer !== "undefined") {
    Object.defineProperty(ArrayBuffer, Symbol.hasInstance, {
      value(instance: unknown): boolean {
        return (
          Object.getPrototypeOf(instance) === ArrayBuffer.prototype ||
          Object.getPrototypeOf(instance) === SharedArrayBuffer.prototype
        );
      },
      configurable: true,
    });
  }
}
