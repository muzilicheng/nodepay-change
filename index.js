'use strict';

require('colors');

const Config = require('./src/config');
const Bot = require('./src/bot');
const initLogger = require('./src/logger');
const {
    readLines,
    displayHeader,
    askAccountType,
    askProxyMode
} = require('./src/utils');

async function main() {
    displayHeader();
    console.log('⏳ Please wait...\n'.yellow);

    const config = new Config();
    const logger = initLogger();

    try {
        const tokens = await readLines('token.txt');
        const useProxy = await askProxyMode();
        let proxies = [];

        if (useProxy) {
            proxies = await readLines('proxy.txt').then(lines =>
                lines.map(line => {
                    const [host, port, username, password] = line.split(':');
                    if (!host || !port) {
                        console.log(`⚠️ ${'Invalid proxy format in'.red} proxy.txt`.yellow);
                        return null;
                    }
                    return { host, port, username, password };
                }).filter(Boolean)
            );
        }

        if (tokens.length === 0) {
            console.log('⚠️ No tokens found in token.txt');
            return;
        }

        if (useProxy && proxies.length < tokens.length * 3) {
            console.log(`⚠️ ${'Not enough proxies for the number of tokens with 3 proxies per token'.yellow}`);
            return;
        }

        const accountType = await askAccountType();
        const bot = new Bot(config, logger);

        if (accountType === 'Single Account') {
            const singleToken = tokens[0];
            const singleProxyList = useProxy ? proxies.slice(0, 3) : [];

            for (const proxy of singleProxyList) {
                bot.connect(singleToken, proxy)
                    .catch(err => console.log(`❌ ${err.message}`.red));
            }

            if (useProxy && proxies.length > 3) {
                console.log(`📝 Note: Additional proxies (${proxies.length - 3}) are available but not used in single account mode.`);
            }
        } else { // Multi-Account Mode
            let proxyIndex = 0;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                const proxyListForAccount = [];

                // Allocate up to 3 proxies for each account
                for (let j = 0; j < 3 && proxyIndex < proxies.length; j++, proxyIndex++) {
                    proxyListForAccount.push(proxies[proxyIndex]);
                }

                // If less than 3 proxies are available, use what's available
                if (proxyListForAccount.length < 3 && proxyIndex >= proxies.length) {
                    console.log(`📝 Note: Less than 3 proxies available for some accounts.`);
                }

                // Connect using allocated proxies
                for (const proxy of proxyListForAccount) {
                    bot.connect(token, proxy)
                        .catch(err => console.log(`❌ ${err.message}`.red));
                }
            }
        }
    } catch (error) {
        console.log(`❌ ${error.message}`.red);
    }

    process.on('SIGINT', () => {
        console.log(`\n👋 ${'Shutting down...'.green}`);
        process.exit(0);
    });
}

main();
