'use strict'

const {Guild, User} = require('discord.js')
const {utc, duration} = require('moment')

const timers = new Map()

/**
 * @param {String} type
 * @param {Guild} guild
 * @param {User} user
 * @param {String} timer
 * @returns {undefined}
 */
module.exports.setTimer = (type, guild, user, timer = '') => {
	if (type && guild && user && typeof timer === 'string' && timer.split(' ').length >= 1) {
		timer = timer.split(' ')
		const args0 = timer.shift()
		let num = ''
		let str = ''
		let idx = 0
		while (args0.length >= idx) {
			if (args0[idx]) {
				if (str.length === 0 && !isNaN(Number(args0[idx]))) {
					num += args0[idx]
				} else if (num.length > 0 && str.length !== 1 && isNaN(Number(args0[idx]))) {
					str += args0[idx]
				}
			}
			idx++
		}
		if (num.length > 0 && str.length === 1) {
			timers.set(`${user.id}_${guild.id}_${type}`, utc(new Date()).add(Number(num), String(str)).valueOf())
		}
	}
}

/**
 * @param {String} type
 * @param {Guild} guild
 * @param {User} user
 * @returns {?Number}
 */
module.exports.getTimer = (type, guild, user) => {
	const key = `${user.id}_${guild.id}_${type}`
	if (timers.has(key)) {
		const tempValue = timers.get(`${user.id}_${guild.id}_${type}`)
		const actualValue = duration(tempValue - utc(new Date()).valueOf()).valueOf()
		if (Math.floor(tempValue/1000) <= 0) timers.delete(key)
		return actualValue
	}
	return undefined
}