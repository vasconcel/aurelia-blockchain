class Block {
    constructor(index, previousHash, timestamp, data, hash, nonce) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.nonce = nonce;
    }

    static get genesis(){
        return new Block(
            0,
            "0",
            1678886400000,
            "Bloco Gênesis",
            "81653231e7016c82073a616e1715c4b77376371202504af54f58073ed6507b51",
            0
        );
    }
}