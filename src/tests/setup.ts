beforeAll(() => {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
});

// Lets React 18 act() flush effects synchronously in jsdom render tests.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

if (!global.atob) {
  global.atob = (str: string) => Buffer.from(str, 'binary').toString('base64');
}
if (!global.btoa) {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}
