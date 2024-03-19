Object.defineProperty(BigInt.prototype, 'toJSON', {
    get() {
        'use strict';
        return () => String(this);
    },
});
export * from './extension';
export * from './web3auth';
//# sourceMappingURL=index.js.map