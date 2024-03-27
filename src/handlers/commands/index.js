const { Client } = require("discord.js")
const { readdirSync, lstatSync, existsSync } = require("fs")
const { join, sep } = require("path")

/**
 * @type {Map<string, { run: import(".").command_run, config: import(".").command_config }}
 */
const cmds = new Map()
const watching = new Array()
const list = {}

async function watch_file (file_path) {
	console.log(`[COMMAND LOADED]: ${file_path.split(sep).pop()}`)

	if (watching.indexOf(file_path) !== -1) return
	watching.push(file_path)

	let mtimeMs = lstatSync(file_path).mtimeMs
	let is_busy = false
	setInterval(() => {
		if (is_busy) return;
		if (existsSync(file_path)) {
			if (lstatSync(file_path).mtimeMs !== mtimeMs) {
				is_busy = true
				delete require.cache[file_path]

				try {
					require(file_path)
					mtimeMs = lstatSync(file_path).mtimeMs
					is_busy = false
					module.exports.load(require("../../events/ready").bot)
				} catch (exception) {
					console.log(`[${file_path.split(sep).pop()} ERRORED | RELOADING IN 5 SECONDS]: ${exception}`)
					setTimeout(() => {
						is_busy = false
					}, 5000)
				}
			}
		}
	}, 1000)
}

/**
 * 
 * @param {import(".").command_run} run
 * @param {import(".").command_config} config 
 */
module.exports.create_command = function (run, config) {
	var line = new Error().stack.split('\n').splice(2, 1)[0]
	line = line.substring(line.indexOf("(") + 1, line.lastIndexOf(":"))
	const file_path = line.substring(0, line.lastIndexOf(":"))

	cmds.set(config.name, {run, config})
	watch_file(file_path)
	console.log(`got called from ${line}`)
}

module.exports.get_command = function (cmd) {
	return cmds.get(cmd)
}

/**
 * 
 * @param {Array} array 
 * @returns 
 */
function create_fixed_array (array) {
	const fixed_array = []

	for (const element of array.sort()) {
		if (typeof element === "object") {
			fixed_array.push(Array.isArray(element) ? create_fixed_array(element) : create_fixed_object(element))
			continue
		}

		fixed_array.push(element)
	}

	return fixed_array
}

function create_fixed_object (object) {
	const fixed_object = {}

	for (const [key, value] of Object.entries(object).sort()) {
		if (value !== undefined && value !== null) {
			if (typeof value === "object") {
				fixed_object[key] = Array.isArray(value) ? create_fixed_array(value) : create_fixed_object(value)
				continue
			}

			fixed_object[key] = value
		}
	}

	return fixed_object
}

/**
 * 
 * @param {Array} o1 
 * @param {Array} o2 
 * @returns 
 */
function compare_options (o1, o2) {
	let _1 = []
	let _2 = []

	for (const object of [...o1].sort())
		_1.push(create_fixed_object(object))

	for (const object of [...o2].sort())
		_2.push(create_fixed_object(object))

	return JSON.stringify(_1) !== JSON.stringify(_2)
}

/**
 * 
 * @param {Client} bot 
 */
module.exports.load = async function(bot) {
	for (const category of readdirSync("./src/cmds")) {
		const dir_path = join(process.cwd(), "src", "cmds", category)

		for (const file of readdirSync(dir_path)) {
			const file_path = join(dir_path, file)
			require(file_path)
		}
	}

	var can_reload = false
	const commands = []

	for (const [name, cmd] of Array.from(cmds)) {
		commands.push({
			name: cmd.config.name,
			description: cmd.config.description,
			type: 1,
			defaultPermission: true,
			options: cmd.config.options
		})

		if (!list[name]) {
			can_reload = true
		} else {
			const c = list[name]

			if (compare_options(c.options, [...(cmd.config.options || [])])) {
				can_reload = true
				c.options = cmd.config.options
			}
		}
	}

	if (commands.length !== 0 && can_reload) {
		await bot.application.commands.set(commands)
	}
}

module.exports.list = list