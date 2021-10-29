import NumberUtils from "../utils/NumberUtils";
import {PlayerStats} from "./data/PlayerStats";
import {GameStats} from "./data/GameStats";
import {OpponentStat} from "./data/OpponentStat";
import Lina from "../blockchain/Lina";
import Web3Utils from "../blockchain/Web3Utils";
import {JaJankenTechnique} from "./data/JaJankenTechnique";
import {v4 as uuidv4} from "uuid";

export default class JaJanken {

    static async getGameEntranceTicketFee(contract: any): Promise<number> {
        return await Lina.call(contract.methods.entranceTicketFee())
    }

    static async joinColiseum(contract: any) {
        this.getGameEntranceTicketFee(contract).then(entranceTicket => {
            Lina.send(contract.methods.joinGame(), {value: entranceTicket})
        })
    }

    static async joinMatchQueue(contract: any) {
        Lina.send(contract.methods.joinMatch()).then(_ => {
        })
    }

    static async getGameStats(contract: any): Promise<GameStats> {
        const alivePlayers = await Lina.call(contract.methods.alivePlayers())
        const totalPaa = await Lina.call(contract.methods.totalPaa())
        const totalChi = await Lina.call(contract.methods.totalChi())
        const totalGuu = await Lina.call(contract.methods.totalGuu())
        return {
            alivePlayers: NumberUtils.from(alivePlayers),
            totalPaa: NumberUtils.from(totalPaa),
            totalChi: NumberUtils.from(totalChi),
            totalGuu: NumberUtils.from(totalGuu)
        }
    }

    static async getMyProfile(contract: any): Promise<PlayerStats | null> {
        const profile = await Lina.call(contract.methods.getProfile())
        const queued = await Lina.call(contract.methods.queued())
        if (profile) {
            return {
                inQueue: queued === Web3Utils.getDefaultAccount(),
                inMatch: profile.inMatch === 1,
                nen: NumberUtils.from(profile.nen),
                guu: NumberUtils.from(profile.guu),
                paa: NumberUtils.from(profile.paa),
                chi: NumberUtils.from(profile.chi)
            }
        } else return null
    }

    static async getOpponent(contract: any, playerAddress: any): Promise<OpponentStat | null> {
        const player = await Lina.call(contract.methods.getPlayer({_player: playerAddress}))
        if (player) {
            return {
                nen: NumberUtils.from(player.nen),
                techniques: NumberUtils.from(player.techniques),
            }
        } else return null
    }

    static Player = class {

        static getKey(): string {
            let key = localStorage.getItem('jajanken-key')

            if (key == null) {
                key = this.initKey()
            }
            return key
        }

        static initKey(): string {
            const key = uuidv4()
            localStorage.setItem('jajanken-key', key)
            return key
        }

        static async commitPlay(contract: any, matchId: string, technique: JaJankenTechnique) {
            Lina.call(contract.methods.encodeAction({_yourAddress: Lina.account(), _action: technique, _revealKey: Web3Utils.encode(this.getKey())})).then(encodedTechnique => {
                Lina.send(contract.methods.playMatch({_commitment: encodedTechnique, _matchId: matchId})).then(_ => {
                })
            })
        }

        static async revealPlay(contract: any, matchId: string, technique: JaJankenTechnique) {
            Lina.send(contract.methods.revealMatch({_action: technique, _revealKey: this.getKey(), _matchId: matchId})).then(_ => {
            })
        }
    }
}