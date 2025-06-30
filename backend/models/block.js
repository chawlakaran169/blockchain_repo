// const mongoose = require('mongoose');

// const BlockSchema = new mongoose.Schema({
//     index: Number,
//     timestamp : {type: Date, default: Date.now},
//     data : {
//         from_uid: String,
//         from_name: String,
//         to_uid: String,
//         to_name: String,
//         land: String,
//         action: String
//     },
//     previousHash : String,
//     hash: String
// });

// module.exports = mongoose.model('block', BlockSchema);
const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
  index: Number,
  timestamp: { type: Date, default: Date.now },
  data: {
    uid:String,
    owner_email: String,
    owner_name: String,
    land_description: String,
    action: String
  },
  previousHash: String,
  hash: String
});

module.exports = mongoose.model('Block', BlockSchema);
