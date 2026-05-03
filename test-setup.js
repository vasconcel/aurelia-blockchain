import { Crypto } from '@peculiar/webcrypto';

if (!global.crypto) {
    Object.defineProperty(global, 'crypto', { value: new Crypto(), writable: true });
} else if (!global.crypto.subtle) {
    global.crypto = new Crypto();
}