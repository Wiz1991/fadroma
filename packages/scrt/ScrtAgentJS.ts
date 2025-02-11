import {
  Console, colors, bold,
  Identity, waitUntilNextBlock,
  Contract, Instance, Message,
  readFile,
  backOff,
  toBase64
} from '@fadroma/ops'
import {
  EnigmaUtils, encodeSecp256k1Pubkey,
  pubkeyToAddress, makeSignBytes, BroadcastMode,
  SigningCosmWasmClient,
} from 'secretjs'

import { ScrtGas, APIConstructor } from './ScrtCore'
import { ScrtAgent } from './ScrtAgent'
import { BroadcastingScrtBundle } from './ScrtBundle'
import type { Scrt } from './ScrtChain'

const console = Console('@fadroma/scrt/ScrtAgentJS')

export abstract class ScrtAgentJS extends ScrtAgent {

  fees = ScrtGas.defaultFees
  defaultDenomination = 'uscrt'
  Bundle = BroadcastingScrtBundle

  constructor (options: Identity & { API?: APIConstructor } = {}) {
    super(options)

    this.name = this.trace.name = options?.name || ''

    this.chain    = options?.chain as Scrt // TODO chain id to chain
    this.fees     = options?.fees || ScrtGas.defaultFees

    this.keyPair  = options?.keyPair
    this.mnemonic = options?.mnemonic
    this.pen      = options?.pen
    if (this.pen) {
      this.pubkey   = encodeSecp256k1Pubkey(options?.pen.pubkey)
      this.address  = pubkeyToAddress(this.pubkey, 'secret')
      this.sign     = this.pen.sign.bind(this.pen)
      this.seed     = EnigmaUtils.GenerateNewSeed()
    }
  }

  readonly name:     string
  readonly chain:    Scrt
  readonly keyPair:  any
  readonly mnemonic: any
  readonly pen:      any
  readonly sign:     any
  readonly pubkey:   any
  readonly seed:     any
  readonly address:  string

  abstract readonly API: typeof SigningCosmWasmClient
  get api () {
    return new this.API(
      this.chain?.url,
      this.address,
      this.sign,
      this.seed,
      this.fees,
      BroadcastMode.Sync
    )
  }

  get nextBlock () { return waitUntilNextBlock(this) }

  get block     () { return this.api.getBlock() }

  get account   () { return this.api.getAccount(this.address) }

  async send (recipient: any, amount: string|number, denom = 'uscrt', memo = "") {
    if (typeof amount === 'number') amount = String(amount)
    return await this.api.sendTokens(recipient, [{denom, amount}], memo)
  }

  async sendMany (txs = [], memo = "", denom = 'uscrt', fee = new ScrtGas(500000 * txs.length)) {
    if (txs.length < 0) {
      throw new Error('tried to send to 0 recipients')
    }
    const from_address = this.address
    //const {accountNumber, sequence} = await this.api.getNonce(from_address)
    let accountNumber: any
    let sequence:      any
    const msg = await Promise.all(txs.map(async ([to_address, amount])=>{
      ({accountNumber, sequence} = await this.api.getNonce(from_address)) // increment nonce?
      if (typeof amount === 'number') amount = String(amount)
      const value = {from_address, to_address, amount: [{denom, amount}]}
      return { type: 'cosmos-sdk/MsgSend', value }
    }))
    const signBytes = makeSignBytes(msg, fee, this.chain.id, memo, accountNumber, sequence)
    return this.api.postTx({ msg, memo, fee, signatures: [await this.sign(signBytes)] })
  }

  async upload (pathToBinary: string) {
    if (!(typeof pathToBinary === 'string')) {
      throw new Error(
        `@fadroma/scrt: Need path to binary (string), received: ${pathToBinary}`
      )
    }
    const data = await readFile(pathToBinary)
    return await this.api.upload(data, {})
  }

  async getCodeHash (idOrAddr: number|string): Promise<string> {
    const { api } = this
    return this.rateLimited(async function getCodeHashInner () {
      if (typeof idOrAddr === 'number') {
        return await api.getCodeHashByCodeId(idOrAddr)
      } else if (typeof idOrAddr === 'string') {
        return await api.getCodeHashByContractAddr(idOrAddr)
      } else {
        throw new TypeError('getCodeHash id or addr')
      }
    })
  }

  async checkCodeHash (address: string, codeHash?: string) {
    // Soft code hash checking for now
    const realCodeHash = await this.getCodeHash(address)
    if (codeHash !== realCodeHash) {
      console.warn(bold('Code hash mismatch for address:'), address)
      console.warn(bold('  Expected code hash:'), codeHash)
      console.warn(bold('  Code hash on chain:'), realCodeHash)
    } else {
      console.info(bold(`Code hash of ${address}:`), realCodeHash)
    }
  }

  async instantiate (template, label, msg, funds = []) {
    if (!template.codeHash) {
      throw new Error('@fadroma/scrt: Template must contain codeHash')
    }
    return super.instantiate(template, label, msg, funds)
  }

  async doInstantiate (template, label, msg, funds = []) {
    const { codeId, codeHash } = template
    const { api } = this
    const { logs, transactionHash } = await this.rateLimited(function doInstantiateInner () {
      return api.instantiate(Number(codeId), msg, label)
    })
    return {
      chainId:  this.chain.id,
      codeId:   Number(codeId),
      codeHash: codeHash,
      address:  logs[0].events[0].attributes[4].value,
      transactionHash,
    }
  }

  /** Instantiate multiple contracts from a bundled transaction. */
  async instantiateMany (
    contracts: [Contract<any>, any?, string?, string?][],
    prefix?: string
  ): Promise<Record<string, Instance>> {
    // results by contract name
    const receipts = await super.instantiateMany(contracts, prefix)
    // populate code hash in receipt and `contract.instance` properties
    for (const i in contracts) {
      const contract = contracts[i][0]
      const receipt = receipts[contract.name]
      if (receipt) {
        receipt.codeHash = contract.template?.codeHash||contract.codeHash
      }
    }
    return receipts
  }

  async getCodeId (address: string): Promise<number> {
    //console.trace('getCodeId', address)
    const { api } = this
    return this.rateLimited(async function getCodeIdInner () {
      const { codeId } = await api.getContract(address)
      return codeId
    })
  }

  async getLabel (address: string): Promise<string> {
    const { api } = this
    return this.rateLimited(async function getLabelInner () {
      const { label } = await api.getContract(address)
      return label
    })
  }

  async doQuery (
    { label, address, codeHash }: Contract<any>, msg: Message
  ) {
    const { api } = this
    return this.rateLimited(function doQueryInner () {
      return api.queryContractSmart(address, msg as any, undefined, codeHash)
    })
    return
  }

  async doExecute (
    { label, address, codeHash }: Contract<any>, msg: Message,
    memo: any, amount: any, fee: any
  ) {
    return this.api.execute(address, msg as any, memo, amount, fee, codeHash)
  }

  async encrypt (codeHash, msg) {
    if (!codeHash) throw new Error('@fadroma/scrt: missing codehash')
    const encrypted = await this.api.restClient.enigmautils.encrypt(codeHash, msg)
    return toBase64(encrypted)
  }

  async signTx (msgs, gas, memo) {
    const { accountNumber, sequence } = await this.api.getNonce()
    return await this.api.signAdapter(
      msgs,
      gas,
      this.chain.id,
      memo,
      accountNumber,
      sequence
    )
  }

  private initialWait = 1000

  private async rateLimited <T> (fn: ()=>Promise<T>): Promise<T> {
    //console.log('rateLimited', fn)
    let initialWait = 0
    if (this.chain.isMainnet && !!process.env.FADROMA_RATE_LIMIT) {
      const initialWait = this.initialWait*Math.random()
      console.warn(
        "Avoid running into rate limiting by waiting",
        Math.floor(initialWait), 'ms'
      )
      await new Promise(resolve=>setTimeout(resolve, initialWait))
      console.warn("Wait is over")
    }
    return backOff(fn, {
      jitter:        'full',
      startingDelay: 100 + initialWait,
      timeMultiple:  3,
      retry (error: Error, attempt: number) {
        if (error.message.includes('500')) {
          console.warn(`Error 500, retry #${attempt}...`)
          console.error(error.message)
          return true
        } else if (error.message.includes('429')) {
          console.warn(`Error 429, retry #${attempt}...`)
          console.error(error.message)
          return true
        } else {
          return false
        }
      }
    })
  }

}
