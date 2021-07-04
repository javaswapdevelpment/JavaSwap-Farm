const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const JavaToken = artifacts.require('JavaToken');
const MaticStaking = artifacts.require('MaticStaking');
const MockBEP20 = artifacts.require('libs/MockBEP20');
const WMATIC = artifacts.require('libs/WMATIC');

contract('MaticStaking.......', async ([alice, bob, admin, dev, minter]) => {
  beforeEach(async () => {
    this.rewardToken = await JavaToken.new({ from: minter });
    this.lpToken = await MockBEP20.new('LPToken', 'LP1', '1000000', {
      from: minter,
    });
    this.wMATIC = await WMATIC.new({ from: minter });
    this.maticChef = await MaticStaking.new(
      this.wMATIC.address,
      this.rewardToken.address,
      1000,
      10,
      1010,
      admin,
      this.wMATIC.address,
      { from: minter }
    );
    await this.rewardToken.mint(this.maticChef.address, 100000, { from: minter });
  });

  it('deposit/withdraw', async () => {
    await time.advanceBlockTo('10');
    await this.maticChef.deposit({ from: alice, value: 100 });
    await this.maticChef.deposit({ from: bob, value: 200 });
    assert.equal(
      (await this.wMATIC.balanceOf(this.maticChef.address)).toString(),
      '300'
    );
    assert.equal((await this.maticChef.pendingReward(alice)).toString(), '1000');
    await this.maticChef.deposit({ from: alice, value: 300 });
    assert.equal((await this.maticChef.pendingReward(alice)).toString(), '0');
    assert.equal((await this.rewardToken.balanceOf(alice)).toString(), '1333');
    await this.maticChef.withdraw('100', { from: alice });
    assert.equal(
      (await this.wMATIC.balanceOf(this.maticChef.address)).toString(),
      '500'
    );
    await this.maticChef.emergencyRewardWithdraw(1000, { from: minter });
    assert.equal((await this.maticChef.pendingReward(bob)).toString(), '1399');
  });

  it('should block man who in blanklist', async () => {
    await this.maticChef.setBlackList(alice, { from: admin });
    await expectRevert(
      this.maticChef.deposit({ from: alice, value: 100 }),
      'in black list'
    );
    await this.maticChef.removeBlackList(alice, { from: admin });
    await this.maticChef.deposit({ from: alice, value: 100 });
    await this.maticChef.setAdmin(dev, { from: minter });
    await expectRevert(
      this.maticChef.setBlackList(alice, { from: admin }),
      'admin: wut?'
    );
  });

  it('emergencyWithdraw', async () => {
    await this.maticChef.deposit({ from: alice, value: 100 });
    await this.maticChef.deposit({ from: bob, value: 200 });
    assert.equal(
      (await this.wMATIC.balanceOf(this.maticChef.address)).toString(),
      '300'
    );
    await this.maticChef.emergencyWithdraw({ from: alice });
    assert.equal(
      (await this.wMATIC.balanceOf(this.maticChef.address)).toString(),
      '200'
    );
    assert.equal((await this.wMATIC.balanceOf(alice)).toString(), '100');
  });

  it('emergencyRewardWithdraw', async () => {
    await expectRevert(
      this.maticChef.emergencyRewardWithdraw(100, { from: alice }),
      'caller is not the owner'
    );
    await this.maticChef.emergencyRewardWithdraw(1000, { from: minter });
    assert.equal((await this.rewardToken.balanceOf(minter)).toString(), '1000');
  });

  it('setLimitAmount', async () => {
    // set limit to 1e-12 MATIC
    await this.maticChef.setLimitAmount('1000000', { from: minter });
    await expectRevert(
      this.maticChef.deposit({ from: alice, value: 100000000 }),
      'exceed the to'
    );
  });
});
