// const crypto = require('crypto');
// const Block = require('../models/block');

// function calculateHash(index, timestamp, data, previousHash) {
//   return crypto
//     .createHash('sha256')
//     .update(index + timestamp + JSON.stringify(data) + previousHash)
//     .digest('hex');
// }

// async function getLastBlock() {
//   return await Block.findOne().sort({ index: -1 });
// }

// async function createGenesisBlock() {
//   const existing = await Block.countDocuments();
//   if (existing === 0) {
//     const timestamp = new Date().toISOString();

//     const data = {
//       owner_email: 'genesis@system.com',
//       owner_name: 'Genesis',
//       land_description: 'Genesis Block',
//       action: 'GENESIS'
//     };

//     const hash = calculateHash(0, timestamp, data, '0');

//     const genesis = new Block({
//       index: 0,
//       timestamp,
//       data,
//       previousHash: '0',
//       hash
//     });

//     await genesis.save();
//   }
// }

// async function addNewBlock(data) {
//   const lastBlock = await getLastBlock();
//   const index = lastBlock ? lastBlock.index + 1 : 0;
//   const previousHash = lastBlock ? lastBlock.hash : '0';
//   const timestamp = new Date().toISOString();
//   const hash = calculateHash(index, timestamp, data, previousHash);

//   const newBlock = new Block({
//     index,
//     timestamp,
//     data,
//     previousHash,
//     hash
//   });

//   await newBlock.save();
// }

// module.exports = {
//   calculateHash,
//   getLastBlock,
//   createGenesisBlock,
//   addNewBlock
// };
const crypto = require('crypto');
const Block = require('../models/block');

/**
 * Calculate SHA256 hash for block data.
 */
function calculateHash(index, timestamp, data, previousHash) {
  return crypto
    .createHash('sha256')
    .update(index + timestamp + JSON.stringify(data) + previousHash)
    .digest('hex');
}

/**
 * Get the last block in the chain.
 */
async function getLastBlock() {
  return await Block.findOne().sort({ index: -1 });
}

/**
 * Create the genesis block if the chain is empty.
 */
async function createGenesisBlock() {
  const count = await Block.countDocuments();
  if (count === 0) {
    const timestamp = new Date().toISOString();

    const data = {
      owner_email: 'genesis@system.com',
      owner_name: 'Genesis',
      land_description: 'Genesis Block',
      action: 'GENESIS'
    };

    const hash = calculateHash(0, timestamp, data, '0');

    const genesisBlock = new Block({
      index: 0,
      timestamp,
      data,
      previousHash: '0',
      hash
    });

    await genesisBlock.save();
    console.log('✅ Genesis block created.');
  } else {
    console.log('✅ Genesis block already exists.');
  }
}

/**
 * Add a new block with structured data.
 */
async function addNewBlock(owner_email, owner_name, land_description, action) {
  const lastBlock = await getLastBlock();
  const index = lastBlock ? lastBlock.index + 1 : 0;
  const previousHash = lastBlock ? lastBlock.hash : '0';
  const timestamp = new Date().toISOString();

  const data = {
    owner_email,
    owner_name,
    land_description,
    action
  };

  const hash = calculateHash(index, timestamp, data, previousHash);

  const newBlock = new Block({
    index,
    timestamp,
    data,
    previousHash,
    hash
  });

  await newBlock.save();
  console.log('✅ New block added to blockchain.');
}

module.exports = {
  calculateHash,
  getLastBlock,
  createGenesisBlock,
  addNewBlock
};
