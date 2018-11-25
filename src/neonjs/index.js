const Neo = require('@cityofzion/neon-js')
const rpc = Neo.rpc
const Neon = Neo.default

let publicKey = '0361e09663f44ae15dff4f59064575af7a9095fed9205480d2cf6cc225bae66213'
let contractAddr = '0x87a61ee8b47876e6ef437c4c403687d2a4f28804'
// let byteArray = "b'#\xba\'\x03\xc52c\xe8\xd6\xe5"\xdc2 39\xdc\xd8\xee\xe9'"
let WIF = 'KxDgvEKzgSBPPfuVfw67oPQBSjidEiqTHURKSDL1R7yGaGYAeYnr'
let account = Neon.create.account(WIF);
let privateKey = Neo.wallet.getPrivateKeyFromWIF(WIF)
const localAddress = require('./properties').address
let networkUrl = `http://${localAddress}:30333`  //'http://localhost:30333'
let neoscanUrl = `http://${localAddress}:4000/api/main_net` //'http://localhost:4000/api/main_net'
let addr_1 = "e9eed8dc39332032dc22e5d6e86332c50327ba23"
const scriptHash = '1825a77f40149e0272b217c480b676136a2f456f' // Scripthash for the contract

// =======================================================================================

// let accountAmount = 50
// let WIFList = []
// let genPrivateKey
// let wif
// for(let i = 0; i < accountAmount; ++i) {
//     genPrivateKey = Neon.create.privateKey(i)
//     wif = Neon.get.WIFFromPrivateKey(privateKey)
//     WIFList.push(wif)
// }

// // Verify keys
// console.log(Neon.is.wif(wif))
// console.log(WIFList)

// let genPrivateKeyA = Neon.create.privateKey()
// let wifA = Neon.get.WIFFromPrivateKey(privateKey)
// console.log(wifA)

//===========================================================================================

const convertByteArrayToInt = function(seed) {
  return parseInt(Neon.u.reverseHex(seed), 16)
  // console.log(parseInt(Neon.u.reverseHex("f401"), 16))   // ByteArray to Int
}

// console.log(Neon.u.hexstring2str("53434c20746f6b656e")) // ByteArray to String

const writeRequest = {
  net: neoscanUrl,
  url: networkUrl,
  script: null,  
  address: account.address,
  privateKey: account.privateKey,
  publicKey: account.publicKey,
  gas: 0,
  balance: null
};

let setToken = async function(address, amount) {
  setToken = Neon.create.script({ 
    scriptHash: scriptHash, 
    operation: "setToken", 
    args: [Neon.u.reverseHex(Neo.wallet.getScriptHashFromAddress(address)), amount]
  })

  try {
    const data = await Neo.api.neoscan.getBalance(neoscanUrl, account.address)
    let setTokenRequest = writeRequest
    // setTokenRequest.address = address
    setTokenRequest.script = setToken
    setTokenRequest.balance = data
    const res = await Neon.doInvoke(setTokenRequest)
    return res.response
  } catch (error) {
    console.log(error)
  }
  // Neo.api.neoscan.getBalance(neoscanUrl, account.address).then(data => {
  //   let setTokenRequest = writeRequest
  //   setTokenRequest.address = address
  //   setTokenRequest.script = setToken
  //   setTokenRequest.balance = data
  //   Neon.doInvoke(setTokenRequest).then(res => console.log(res.response));
  // }).catch(err => {
  //   console.log(err)
  // });
}

let bonusToken = async function(address, amount) {
  bonusToken = Neon.create.script({ 
    scriptHash: scriptHash, 
    operation: "bonusToken", 
    args: [Neon.u.reverseHex(Neo.wallet.getScriptHashFromAddress(address)), amount]
  })

  try {
    const data = await Neo.api.neoscan.getBalance(neoscanUrl, account.address)
    let bonusTokenRequest = writeRequest
    // bonusTokenRequest.address = address
    bonusTokenRequest.script = bonusToken
    bonusTokenRequest.balance = data
    const res = Neon.doInvoke(bonusTokenRequest)
    return res.response
  } catch (error) {
    console.log(error)
  }

  // Neo.api.neoscan.getBalance(neoscanUrl, account.address).then(data => {
  //   let bonusTokenRequest = writeRequest
  //   bonusTokenRequest.address = address
  //   bonusTokenRequest.script = bonusToken
  //   bonusTokenRequest.balance = data
  //   Neon.doInvoke(bonusTokenRequest).then(res => console.log(res.response));
  // }).catch(err => {
  //   console.log(err)
  // });
}

let minusToken = async function(address, amount) {
  minusToken = Neon.create.script({ 
    scriptHash, 
    operation: "minusToken", 
    args: [Neon.u.reverseHex(Neo.wallet.getScriptHashFromAddress(address)), amount]
  })

  try {
    const data = await Neo.api.neoscan.getBalance(neoscanUrl, account.address)
    let minusTokenRequest = writeRequest
    // minusTokenRequest.address = address
    minusTokenRequest.script = minusToken
    minusTokenRequest.balance = data
    const res = await Neon.doInvoke(minusTokenRequest)
    return res.response
  } catch (error) {
    console.log(error)
  }  
}

let balanceOf = async function(address) {
  get_BalanceOf = {
    scriptHash, 
    operation: 'balanceOf', 
    args: [Neon.u.reverseHex(Neo.wallet.getScriptHashFromAddress(address))]
  }  
  try {
    const balanceOfScript = await Neon.create.script(get_BalanceOf) 
    const res = await rpc.Query.invokeScript(balanceOfScript).execute(networkUrl)                 
    return convertByteArrayToInt(res.result.stack[0].value)
  } catch (error) {
    console.log(error)
  }  
}

let getTime = async function() {
  getTime = {scriptHash, operation: 'getTime', args: []}
  try {
    const getTimeScript = Neon.create.script(getTime) 
    const res = await rpc.Query.invokeScript(getTimeScript).execute(networkUrl)                 
    return res.result.stack[0].value   
  } catch (error) {
    console.log(error)
  }  
}

module.exports = {
  setToken, 
  bonusToken, 
  minusToken, 
  balanceOf, 
  getTime,
  account
}