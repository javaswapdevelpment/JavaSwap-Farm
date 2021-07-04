const { assert } = require("chai");

const JavaToken = artifacts.require('JavaToken');

contract('JavaToken', ([alice, bob, carol, dev, minter]) => {
    beforeEach(async () => {
        this.java = await JavaToken.new({ from: minter });
    });


    it('mint', async () => {
        await this.java.mint(alice, 1000, { from: minter });
        assert.equal((await this.java.balanceOf(alice)).toString(), '1000');
    })
});
